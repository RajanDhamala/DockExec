"""
safety_checker.py

Stricter sandbox sanitizer for Python, JavaScript, C, Go, Java.

Key behaviors:
- Allow only a small whitelist of imports per language.
- Reject submissions that import more than a small configured number of modules.
- Explicitly disallow filesystem / OS / process modules/APIs in all languages.
- Detect and block large memory allocation attempts (configurable threshold).
- Configuration defaults are conservative (small) but can be adjusted on instantiation.

Usage:
    checker = SafetyChecker(threshold_bytes=128*1024**2, max_imports=3)
    ok = checker.check(code_string, "python")
    if not ok:
        print(checker.reason())
"""
import ast
import re
from typing import List, Set, Optional


class SafetyChecker:
    def __init__(
        self,
        threshold_bytes: int = 128 * 1024 ** 2,  # default 128 MiB
        max_imports: int = 4,  # maximum allowed distinct imports per submission
    ):
        self.reasons: List[str] = []

        # Configurable limits
        self.THRESHOLD_BYTES = int(threshold_bytes)
        self.MAX_IMPORTS = int(max_imports)

        # Whitelists (small and conservative)
        self._allowed_python_modules: Set[str] = {
            "math",
            "random",
            "re",
            "functools",
            "itertools",
            "collections",
            "heapq",
            "bisect",
            "statistics",
            "typing",
            "dataclasses",
        }
        self._disallowed_python_modules: Set[str] = {
            "os",
            "pathlib",
            "shutil",
            "subprocess",
            "socket",
            "ctypes",
            "multiprocessing",
            "threading",
            "posix",
            "importlib",
            "sys",
        }

        self._allowed_js_bare_modules: Set[str] = {"assert"}
        self._disallowed_js_modules: Set[str] = {"fs", "child_process", "process", "worker_threads", "cluster"}

        self._allowed_c_headers: Set[str] = {
            "stdio.h",
            "stdlib.h",
            "string.h",
            "math.h",
            "limits.h",
            "stdbool.h",
            "stdint.h",
            "stddef.h",
        }

        self._allowed_go_imports: Set[str] = {
            "fmt",
            "math",
            "strings",
            "strconv",
            "time",
            "bytes",
            "unicode",
        }

        self._allowed_java_prefixes: Set[str] = {"java.lang", "java.util", "java.math"}

    # Public API
    def check(self, code: str, language: str) -> bool:
        self.reasons.clear()
        lang = language.lower().strip()

        if lang == "python":
            return self._check_python(code)
        if lang in {"js", "javascript"}:
            return self._check_javascript(code)
        if lang == "c":
            return self._check_c(code)
        if lang == "go":
            return self._check_go(code)
        if lang == "java":
            return self._check_java(code)

        self.reasons.append(f"Unsupported language: {lang}")
        return False

    def reason(self) -> str:
        return "; ".join(self.reasons) if self.reasons else "Safe to execute."

    # ----- numeric evaluator for literal/expression sizes -----
    def _safe_eval_numeric_expr(self, expr: str) -> Optional[int]:
        """
        Safely evaluate numeric expressions consisting only of literals and allowed operators.
        Returns int value or None if expression is not statically evaluable / safe.
        """
        cleaned = re.sub(r'(?i)(?<=\d)[uUlL]+', '', expr)  # strip integer suffixes
        cleaned = cleaned.replace("_", "")
        try:
            node = ast.parse(cleaned, mode="eval").body
        except Exception:
            return None

        def _eval(n):
            if isinstance(n, ast.Constant) and isinstance(n.value, int):
                return n.value
            if isinstance(n, ast.Num):
                return n.n
            if isinstance(n, ast.BinOp):
                l = _eval(n.left)
                r = _eval(n.right)
                if l is None or r is None:
                    raise ValueError
                if isinstance(n.op, ast.Add):
                    return l + r
                if isinstance(n.op, ast.Sub):
                    return l - r
                if isinstance(n.op, ast.Mult):
                    return l * r
                if isinstance(n.op, (ast.Div, ast.FloorDiv)):
                    if r == 0:
                        raise ValueError
                    return l // r
                if isinstance(n.op, ast.Mod):
                    return l % r
                if isinstance(n.op, ast.LShift):
                    return l << r
                if isinstance(n.op, ast.RShift):
                    return l >> r
                if isinstance(n.op, ast.Pow):
                    if r > 64:
                        raise ValueError
                    return l ** r
                raise ValueError
            if isinstance(n, ast.UnaryOp) and isinstance(n.op, (ast.UAdd, ast.USub)):
                v = _eval(n.operand)
                return +v if isinstance(n.op, ast.UAdd) else -v
            return None

        try:
            val = _eval(node)
            return val if isinstance(val, int) else None
        except Exception:
            return None

    def _is_value_too_large(self, expr: str) -> bool:
        v = self._safe_eval_numeric_expr(expr)
        return v is not None and v >= self.THRESHOLD_BYTES

    # ---------------- Python ----------------
    def _check_python(self, code: str) -> bool:
        try:
            tree = ast.parse(code)
        except Exception:
            self.reasons.append("Invalid Python syntax.")
            return False

        imports_found: Set[str] = set()

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root = alias.name.split(".")[0]
                    imports_found.add(root)
                    if root in self._disallowed_python_modules:
                        self.reasons.append(f"Import of disallowed module '{alias.name}'.")
                        return False
                    if root not in self._allowed_python_modules:
                        self.reasons.append(f"Import of module '{alias.name}' not allowed by whitelist.")
                        return False

            if isinstance(node, ast.ImportFrom):
                mod = node.module or ""
                if not mod:
                    self.reasons.append("Relative imports are not allowed.")
                    return False
                root = mod.split(".")[0]
                imports_found.add(root)
                if root in self._disallowed_python_modules:
                    self.reasons.append(f"Import from disallowed module '{mod}'.")
                    return False
                if root not in self._allowed_python_modules:
                    self.reasons.append(f"Import from module '{mod}' not allowed by whitelist.")
                    return False

            # disallow attribute access on disallowed modules (e.g., os.system)
            if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name):
                if node.value.id in self._disallowed_python_modules:
                    self.reasons.append(f"Access to module '{node.value.id}' is not allowed.")
                    return False

            # block dangerous builtins
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name) and node.func.id in {
                    "open",
                    "exec",
                    "eval",
                    "__import__",
                    "compile",
                    "input",
                }:
                    self.reasons.append(f"Use of builtin '{node.func.id}' not allowed.")
                    return False

                # detect large bytearray/bytes allocations: bytearray(N)/bytes(N)
                if isinstance(node.func, ast.Name) and node.func.id in {"bytearray", "bytes"} and node.args:
                    arg = node.args[0]
                    if isinstance(arg, (ast.Constant, ast.Num)) and isinstance(getattr(arg, "n", getattr(arg, "value", None)), int):
                        val = arg.n if hasattr(arg, "n") else arg.value
                        if val >= self.THRESHOLD_BYTES:
                            self.reasons.append(f"Large allocation request: {node.func.id}({val}) >= threshold")
                            return False
                    else:
                        seg = ast.get_source_segment(code, arg) or ""
                        if seg and self._is_value_too_large(seg):
                            self.reasons.append(f"Large allocation expression in Python: {seg}")
                            return False

                # list(range(N)) detection
                if isinstance(node.func, ast.Name) and node.func.id == "list" and node.args:
                    inner = node.args[0]
                    if isinstance(inner, ast.Call) and isinstance(inner.func, ast.Name) and inner.func.id == "range":
                        if inner.args:
                            seg = ast.get_source_segment(code, inner.args[0]) or ""
                            if seg and self._is_value_too_large(seg):
                                self.reasons.append(f"Large list(range(...)) requested: {seg}")
                                return False

            # list * N multiplication
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Mult):
                left, right = node.left, node.right
                for lit in (left, right):
                    other = right if lit is left else left
                    if isinstance(lit, (ast.Constant, ast.Num)) and isinstance(getattr(lit, "n", getattr(lit, "value", None)), int):
                        val = lit.n if hasattr(lit, "n") else lit.value
                        if val >= self.THRESHOLD_BYTES:
                            self.reasons.append(f"Large list multiplication in Python: multiplier {val} >= threshold")
                            return False
                    elif isinstance(other, (ast.List, ast.Tuple)) and isinstance(lit, ast.Call):
                        seg = ast.get_source_segment(code, lit) or ""
                        if seg and self._is_value_too_large(seg):
                            self.reasons.append(f"Large list multiplication expression: {seg}")
                            return False

        if len(imports_found) > self.MAX_IMPORTS:
            self.reasons.append(f"Too many distinct imports in Python ({len(imports_found)} > {self.MAX_IMPORTS}).")
            return False

        return True

    # ---------------- JavaScript ----------------
    def _check_javascript(self, code: str) -> bool:
        imports = re.findall(r'^\s*import\s+(?:.+\s+from\s+)?[\'"]([^\'"]+)[\'"]', code, flags=re.M)
        requires = re.findall(r'require\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)', code)
        all_targets = set(imports + requires)

        # count non-relative imports
        nonlocal_imports = [t for t in all_targets if not (t.startswith(".") or t.startswith("/"))]
        if len(nonlocal_imports) > self.MAX_IMPORTS:
            self.reasons.append(f"Too many non-local JS imports ({len(nonlocal_imports)} > {self.MAX_IMPORTS}).")
            return False

        for target in all_targets:
            if target.startswith(".") or target.startswith("/"):
                continue
            if target in self._allowed_js_bare_modules:
                continue
            if target in self._disallowed_js_modules:
                self.reasons.append(f"JS import/require disallowed target '{target}'.")
                return False
            self.reasons.append(f"JS import/require target '{target}' not allowed.")
            return False

        # block known process/fs/child_process usage and large allocation APIs
        forbidden_patterns = [
            r'\bprocess\b',
            r'\bfs\b',
            r'\bchild_process\b',
            r'\bexecSync\b',
            r'Buffer\.alloc\s*\(',
            r'new\s+Array\s*\(',
            r'Uint8Array\s*\(',
            r'Int8Array\s*\(',
        ]
        for p in forbidden_patterns:
            if re.search(p, code):
                # handle Buffer.alloc/new Array size checks
                if "Buffer.alloc" in p or "new\s+Array" in p or "Uint8Array" in p:
                    m = re.search(r'Buffer\.alloc\s*\(\s*([^\)]+)\)', code)
                    if m and self._is_value_too_large(m.group(1)):
                        self.reasons.append(f"Large JS allocation detected: Buffer.alloc({m.group(1)})")
                        return False
                    m2 = re.search(r'new\s+Array\s*\(\s*([^\)]+)\)', code)
                    if m2 and self._is_value_too_large(m2.group(1)):
                        self.reasons.append(f"Large JS allocation detected: new Array({m2.group(1)})")
                        return False
                self.reasons.append(f"Blocked JS pattern: {p}")
                return False

        return True

    # ---------------- C ----------------
    def _check_c(self, code: str) -> bool:
        includes = re.findall(r'#\s*include\s*[<"]([^>"]+)[>"]', code)
        if len(includes) > self.MAX_IMPORTS:
            self.reasons.append(f"Too many C includes ({len(includes)} > {self.MAX_IMPORTS}).")
            return False
        for header in includes:
            if header not in self._allowed_c_headers:
                self.reasons.append(f"C header not allowed: {header}")
                return False

        blocked_funcs = [
            r"\bsystem\s*\(",
            r"\bfork\s*\(",
            r"\bexec(?:ve|vp|v)?\b",
            r"\bpopen\s*\(",
            r"\bunlink\s*\(",
            r"\bchmod\s*\(",
            r"\bfopen\s*\(",
            r"\bopen\s*\(",
        ]
        for p in blocked_funcs:
            if re.search(p, code):
                self.reasons.append(f"Blocked function/pattern in C: {p}")
                return False

        # detect malloc/calloc/realloc large requests
        alloc_patterns = [
            r'\bmalloc\s*\(\s*([^\)]+)\)',
            r'\bcalloc\s*\(\s*([^\),]+)\s*,\s*([^\)]+)\)',
            r'\brealloc\s*\(\s*[^,]+,\s*([^\)]+)\)',
        ]
        for pat in alloc_patterns:
            for m in re.finditer(pat, code):
                for grp in m.groups():
                    if not grp:
                        continue
                    if self._is_value_too_large(grp):
                        self.reasons.append(f"C allocation too large: {m.group(0)}")
                        return False

        # static arrays like int buf[N];
        static_arrs = re.findall(r'\b[a-zA-Z_]\w*\s+[a-zA-Z_]\w*\s*\[\s*([^\]]+)\s*\]\s*;', code)
        for expr in static_arrs:
            if self._is_value_too_large(expr):
                self.reasons.append(f"Static array allocation too large: [{expr}]")
                return False

        return True

    # ---------------- Go ----------------
    def _check_go(self, code: str) -> bool:
        single_imports = re.findall(r'(?m)^\s*import\s+"([^"]+)"', code)
        block_matches = re.findall(r'import\s*\(\s*([\s\S]*?)\s*\)', code)
        block_imports = []
        for bm in block_matches:
            block_imports += re.findall(r'"([^"]+)"', bm)
        aliased = re.findall(r'(?m)^\s*import\s+[\w_]+\s+"([^"]+)"', code)
        all_imports = set(single_imports + block_imports + aliased)

        if len(all_imports) > self.MAX_IMPORTS:
            self.reasons.append(f"Too many Go imports ({len(all_imports)} > {self.MAX_IMPORTS}).")
            return False

        for imp in all_imports:
            short = imp.split("/")[-1]
            if short not in self._allowed_go_imports:
                self.reasons.append(f"Go import not allowed: {imp}")
                return False
            if short == "os":
                self.reasons.append("Go 'os' package is disallowed.")
                return False

        suspicious_patterns = [
            r'\bos\b',
            r'\bexec\.Command\b',
            r'\bsyscall\b',
            r'\bnet\b',
            r'\bruntime\b',
            r'\bplugin\b',
            r'\bunsafe\b',
        ]
        for p in suspicious_patterns:
            if re.search(p, code):
                self.reasons.append(f"Suspicious pattern in Go: {p}")
                return False

        # detect make([]T, N) allocations
        for m in re.finditer(r'make\s*\(\s*\[\]\s*\w+\s*,\s*([^\),]+)', code):
            expr = m.group(1)
            if self._is_value_too_large(expr):
                self.reasons.append(f"Large Go allocation detected: make(..., {expr})")
                return False

        # detect make with two args make([]byte, N) general pattern
        for m in re.finditer(r'make\s*\(\s*[^,]+,\s*([^\),]+)', code):
            expr = m.group(1)
            if self._is_value_too_large(expr):
                self.reasons.append(f"Large Go allocation detected: make(..., {expr})")
                return False

        return True

    # ---------------- Java ----------------
    def _check_java(self, code: str) -> bool:
        imports = re.findall(r'^\s*import\s+([\w\.]+)(?:\.\*)?;', code, flags=re.M)
        if len(imports) > self.MAX_IMPORTS:
            self.reasons.append(f"Too many Java imports ({len(imports)} > {self.MAX_IMPORTS}).")
            return False

        for imp in imports:
            allowed = any(imp == prefix or imp.startswith(prefix + ".") for prefix in self._allowed_java_prefixes)
            if not allowed:
                if imp.startswith("java.io") or imp.startswith("java.net") or imp.startswith("java.nio"):
                    self.reasons.append(f"Java import for filesystem/network not allowed: {imp}")
                    return False
                self.reasons.append(f"Java import not allowed: {imp}")
                return False

        forbidden_patterns = [
            r"Runtime\.getRuntime",
            r"ProcessBuilder",
            r"System\.exit\s*\(",
            r"java\.io",
            r"java\.net",
            r"java\.nio",
            r"Files\.",
            r"Paths\.",
            r"FileInputStream",
            r"FileOutputStream",
        ]
        for p in forbidden_patterns:
            if re.search(p, code):
                self.reasons.append(f"Blocked Java pattern: {p}")
                return False

        # new byte[SIZE]
        for m in re.finditer(r'new\s+byte\s*\[\s*([^\]]+)\s*\]', code):
            expr = m.group(1)
            if self._is_value_too_large(expr):
                self.reasons.append(f"Large Java byte[] allocation: new byte[{expr}]")
                return False

        # ByteBuffer.allocate(N)
        for m in re.finditer(r'ByteBuffer\.allocate\s*\(\s*([^\)]+)\)', code):
            expr = m.group(1)
            if self._is_value_too_large(expr):
                self.reasons.append(f"Large ByteBuffer allocation: ByteBuffer.allocate({expr})")
                return False

        return True
# problem_templates.py

PROBLEM_TEMPLATES = {
    "twoSum": {  # Two Sum
        "python": """{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
result = twoSum(nums, target)
print(result)""",

        "javascript": """{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const result = twoSum(nums, target);
console.log(JSON.stringify(result));""",

        "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        int[] result = solution.twoSum(nums, target);
        System.out.println(Arrays.toString(result));
    }
}""",

        "go": """package main
import (
 "encoding/json"
 "fmt"
)

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    result := twoSum(nums, target)
    b, _ := json.Marshal(result) // convert slice to JSON string
    fmt.Println(string(b))  
}""",

 "c": """#include <stdio.h>
#include <stdlib.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    int returnSize = 0;
    int* result = twoSum(nums, numsSize, target, &returnSize);
    
    // Safety check for NULL result
    if (result == NULL) {
        printf("NULL\\n");
        return 0;
    }
    
    // Safety check for invalid size
    if (returnSize <= 0) {
        printf("[]\\n");
        return 0;
    }
    
    printf("[");
    for(int i = 0; i < returnSize; i++) {
        printf("%d", result[i]);
        if(i < returnSize - 1) printf(",");
    }
    printf("]\\n");
    
    return 0;
}"""
    },
    "addTwoNumbers": {  # Add Two Numbers (LinkedList)
        "python": """# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def array_to_list(arr):
    if not arr:
        return None
    head = ListNode(arr[0])
    current = head
    for val in arr[1:]:
        current.next = ListNode(val)
        current = current.next
    return head

def list_to_array(head):
    if isinstance(head, list):  # Handle user returning array directly
        return head
    result = []
    while head:
        result.append(head.val)
        head = head.next
    return result

{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
l1_list = array_to_list(l1)
l2_list = array_to_list(l2)
result = addTwoNumbers(l1_list, l2_list)
print(list_to_array(result))""",

        "javascript": """function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
}

function arrayToList(arr) {
    if (!arr || arr.length === 0) return null;
    let head = new ListNode(arr[0]);
    let current = head;
    for (let i = 1; i < arr.length; i++) {
        current.next = new ListNode(arr[i]);
        current = current.next;
    }
    return head;
}

function listToArray(head) {
    if (Array.isArray(head)) return head;  // Handle direct array return
    let result = [];
    while (head) {
        result.push(head.val);
        head = head.next;
    }
    return result;
}

{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const l1_list = arrayToList(l1);
const l2_list = arrayToList(l2);
const result = addTwoNumbers(l1_list, l2_list);
console.log(JSON.stringify(listToArray(result)));""",

        "java": """import java.util.*;


class ArrayListConverter {
    public static ListNode arrayToList(int[] arr) {
        if (arr == null || arr.length == 0) return null;
        ListNode head = new ListNode(arr[0]);
        ListNode current = head;
        for (int i = 1; i < arr.length; i++) {
            current.next = new ListNode(arr[i]);
            current = current.next;
        }
        return head;
    }
    
    public static int[] listToArray(ListNode head) {
        List<Integer> result = new ArrayList<>();
        while (head != null) {
            result.add(head.val);
            head = head.next;
        }
        return result.stream().mapToInt(i -> i).toArray();
    }
}

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        ListNode l1_list = ArrayListConverter.arrayToList(l1);
        ListNode l2_list = ArrayListConverter.arrayToList(l2);
        ListNode result = solution.addTwoNumbers(l1_list, l2_list);
        System.out.println(Arrays.toString(ArrayListConverter.listToArray(result)));
    }
}""",

        "go": """package main
import "fmt"


func arrayToList(arr []int) *ListNode {
    if len(arr) == 0 {
        return nil
    }
    head := &ListNode{Val: arr[0]}
    current := head
    for i := 1; i < len(arr); i++ {
        current.Next = &ListNode{Val: arr[i]}
        current = current.Next
    }
    return head
}

func listToArray(head *ListNode) []int {
    var result []int
    for head != nil {
        result = append(result, head.Val)
        head = head.Next
    }
    return result
}

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    l1List := arrayToList(l1)
    l2List := arrayToList(l2)
    result := addTwoNumbers(l1List, l2List)
    fmt.Println(listToArray(result))
}""",
"c": """#include <stdio.h>
#include <stdlib.h>

// User code contains struct ListNode definition
{{USER_CODE}}

struct ListNode* createNode(int val) {
    struct ListNode* node = (struct ListNode*)malloc(sizeof(struct ListNode));
    node->val = val;
    node->next = NULL;
    return node;
}

struct ListNode* arrayToList(int arr[], int size) {
    if (size == 0) return NULL;
    struct ListNode* head = createNode(arr[0]);
    struct ListNode* current = head;
    for (int i = 1; i < size; i++) {
        current->next = createNode(arr[i]);
        current = current->next;
    }
    return head;
}

void printList(struct ListNode* head) {
    printf("[");
    int first = 1;
    while (head) {
        if (!first) printf(",");
        printf("%d", head->val);
        first = 0;
        head = head->next;
    }
    printf("]\\n");
}

int main() {
    {{TEST_VARIABLES}}
    struct ListNode* l1List = arrayToList(l1, l1_size);
    struct ListNode* l2List = arrayToList(l2, l2_size);
    struct ListNode* result = addTwoNumbers(l1List, l2List);  // or mergeTwoLists, reverseList
    printList(result);
    return 0;
}"""
    },
    "lengthOfLongestSubstring": {  # Longest Substring Without Repeating Characters
        "python": """{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
result = lengthOfLongestSubstring(s)
print(result)""",

        "javascript": """{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const result = lengthOfLongestSubstring(s);
console.log(JSON.stringify(result));""",

        "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        int result = solution.lengthOfLongestSubstring(s);
        System.out.println(result);
    }
}""",

        "go": """package main
import "fmt"

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    result := lengthOfLongestSubstring(s)
    fmt.Println(result)
}""",

        "c": """#include <stdio.h>
#include <stdlib.h>
#include <string.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    int result = lengthOfLongestSubstring(s);
    printf("%d\\n", result);
    return 0;
}"""
    },
    "findMedianSortedArrays": {  # Median of Two Sorted Arrays
        "python": """{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
result = findMedianSortedArrays(nums1, nums2)
print(result)""",

        "javascript": """{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const result = findMedianSortedArrays(nums1, nums2);
console.log(JSON.stringify(result));""",

        "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        double result = solution.findMedianSortedArrays(nums1, nums2);
        System.out.println(String.format("%.5f", result));
    }
}""",

        "go": """package main
import "fmt"

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    result := findMedianSortedArrays(nums1, nums2)
    fmt.Printf("%.5f\\n", result)
}""",

        "c": """#include <stdio.h>
#include <stdlib.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    double result = findMedianSortedArrays(nums1, nums1Size, nums2, nums2Size);
    printf("%.5f\\n", result);
    return 0;
}"""
    },

    "reverseList": {  # Reverse a Linked List (Custom - LinkedList)
        "python": """# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def array_to_list(arr):
    if not arr:
        return None
    head = ListNode(arr[0])
    current = head
    for val in arr[1:]:
        current.next = ListNode(val)
        current = current.next
    return head

def list_to_array(head):
    if isinstance(head, list):
        return head
    result = []
    while head:
        result.append(head.val)
        head = head.next
    return result

{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
head_list = array_to_list(head)
result = reverseList(head_list)
print(list_to_array(result))""",

        "javascript": """function ListNode(val, next) {
    this.val = val || 0;
    this.next = next || null;
}

function arrayToList(arr) {
    if (!arr || arr.length === 0) return null;
    let head = new ListNode(arr[0]);
    let current = head;
    for (let i = 1; i < arr.length; i++) {
        current.next = new ListNode(arr[i]);
        current = current.next;
    }
    return head;
}

function listToArray(head) {
    if (Array.isArray(head)) return head;
    let result = [];
    while (head) {
        result.push(head.val);
        head = head.next;
    }
    return result;
}

{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const headList = arrayToList(head);
const result = reverseList(headList);
console.log(JSON.stringify(listToArray(result)));""",

        "java": """import java.util.*;

class ArrayListConverter {
    public static ListNode arrayToList(int[] arr) {
        if (arr == null || arr.length == 0) return null;
        ListNode head = new ListNode(arr[0]);
        ListNode current = head;
        for (int i = 1; i < arr.length; i++) {
            current.next = new ListNode(arr[i]);
            current = current.next;
        }
        return head;
    }
    
    public static int[] listToArray(ListNode head) {
        List<Integer> result = new ArrayList<>();
        while (head != null) {
            result.add(head.val);
            head = head.next;
        }
        return result.stream().mapToInt(i -> i).toArray();
    }
}

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        ListNode headList = ArrayListConverter.arrayToList(head);
        ListNode result = solution.reverseList(headList);
        System.out.println(Arrays.toString(ArrayListConverter.listToArray(result)));
    }
}""",

        "go": """package main
import "fmt"

func arrayToList(arr []int) *ListNode {
    if len(arr) == 0 {
        return nil
    }
    head := &ListNode{Val: arr[0]}
    current := head
    for i := 1; i < len(arr); i++ {
        current.Next = &ListNode{Val: arr[i]}
        current = current.Next
    }
    return head
}

func listToArray(head *ListNode) []int {
    var result []int
    for head != nil {
        result = append(result, head.Val)
        head = head.Next
    }
    return result
}

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    headList := arrayToList(head)
    result := reverseList(headList)
    fmt.Println(listToArray(result))
}""",

        "c":  """#include <stdio.h>
#include <stdlib.h>

struct ListNode {
    int val;
    struct ListNode *next;
};

struct ListNode* createNode(int val) {
    struct ListNode* node = (struct ListNode*)malloc(sizeof(struct ListNode));
    node->val = val;
    node->next = NULL;
    return node;
}

struct ListNode* arrayToList(int arr[], int size) {
    if (size == 0) return NULL;
    struct ListNode* head = createNode(arr[0]);
    struct ListNode* current = head;
    for (int i = 1; i < size; i++) {
        current->next = createNode(arr[i]);
        current = current->next;
    }
    return head;
}

void printList(struct ListNode* head) {
    printf("[");
    int first = 1;
    while (head) {
        if (!first) printf(",");
        printf("%d", head->val);
        first = 0;
        head = head->next;
    }
    printf("]\\n");
}

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    struct ListNode* headList = arrayToList(head, head_size);
    struct ListNode* result = reverseList(headList);
    printList(result);
    return 0;
}"""
    },

    "sortArray": {  # Sort an Array
        "python": """{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
result = sortArray(nums)
print(result)""",

        "javascript": """{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const result = sortArray(nums);
console.log(JSON.stringify(result));""",

        "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        int[] result = solution.sortArray(nums);
        System.out.println(Arrays.toString(result));
    }
}""",

        "go": """package main
import "fmt"

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    result := sortArray(nums)
    fmt.Println(result)
}""",

        "c": """#include <stdio.h>
#include <stdlib.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    int* result = sortArray(nums, numsSize);
    printf("[");
    for(int i = 0; i < numsSize; i++) {
        printf("%d", result[i]);
        if(i < numsSize - 1) printf(",");
    }
    printf("]\\n");
    return 0;
}"""
    },

    "reverseString": {  # Reverse a String (Custom - Character Array)
        "python": """{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
reverseString(s)
print(s)""",

        "javascript": """{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
reverseString(s);
console.log(JSON.stringify(s));""",

        "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        solution.reverseString(s);
        System.out.println(Arrays.toString(s));
    }
}""",

        "go": """package main
import "fmt"

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    reverseString(s)
    fmt.Printf("%%q\\n", s)
}""",

        "c": """#include <stdio.h>
#include <stdlib.h>
#include <string.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    reverseString(s, s_size);
    printf("[");
    for(int i = 0; i < s_size; i++) {
        printf("'%c'", s[i]);
        if(i < s_size - 1) printf(",");
    }
    printf("]\\n");
    return 0;
}"""
    },

    "isArmstrong": {  # Check Armstrong Number
        "python": """{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
result = isArmstrong(n)
print(result)""",

        "javascript": """{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const result = isArmstrong(n);
console.log(JSON.stringify(result));""",

        "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        boolean result = solution.isArmstrong(n);
        System.out.println(result);
    }
}""",

        "go": """package main
import "fmt"

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    result := isArmstrong(n)
    fmt.Println(result)
}""",

        "c": """#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    bool result = isArmstrong(n);
    printf("%s\\n", result ? "true" : "false");
    return 0;
}"""
    },

    "mergeTwoLists": {  # Merge Two Sorted Linked Lists (Custom - LinkedList)
        "python": """# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def array_to_list(arr):
    if not arr:
        return None
    head = ListNode(arr[0])
    current = head
    for val in arr[1:]:
        current.next = ListNode(val)
        current = current.next
    return head

def list_to_array(head):
    if isinstance(head, list):
        return head
    result = []
    while head:
        result.append(head.val)
        head = head.next
    return result

{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
l1_list = array_to_list(l1)
l2_list = array_to_list(l2)
result = mergeTwoLists(l1_list, l2_list)
print(list_to_array(result))""",

        "javascript": """function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
}

function arrayToList(arr) {
    if (!arr || arr.length === 0) return null;
    let head = new ListNode(arr[0]);
    let current = head;
    for (let i = 1; i < arr.length; i++) {
        current.next = new ListNode(arr[i]);
        current = current.next;
    }
    return head;
}

function listToArray(head) {
    if (Array.isArray(head)) return head;
    let result = [];
    while (head) {
        result.push(head.val);
        head = head.next;
    }
    return result;
}

{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const l1List = arrayToList(l1);
const l2List = arrayToList(l2);
const result = mergeTwoLists(l1List, l2List);
console.log(JSON.stringify(listToArray(result)));""",

        "java": """import java.util.*;

class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class ArrayListConverter {
    public static ListNode arrayToList(int[] arr) {
        if (arr == null || arr.length == 0) return null;
        ListNode head = new ListNode(arr[0]);
        ListNode current = head;
        for (int i = 1; i < arr.length; i++) {
            current.next = new ListNode(arr[i]);
            current = current.next;
        }
        return head;
    }
    
    public static int[] listToArray(ListNode head) {
        List<Integer> result = new ArrayList<>();
        while (head != null) {
            result.add(head.val);
            head = head.next;
        }
        return result.stream().mapToInt(i -> i).toArray();
    }
}

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        ListNode l1List = ArrayListConverter.arrayToList(l1);
        ListNode l2List = ArrayListConverter.arrayToList(l2);
        ListNode result = solution.mergeTwoLists(l1List, l2List);
        System.out.println(Arrays.toString(ArrayListConverter.listToArray(result)));
    }
}""",

        "go": """package main
import "fmt"

type ListNode struct {
    Val  int
    Next *ListNode
}

func arrayToList(arr []int) *ListNode {
    if len(arr) == 0 {
        return nil
    }
    head := &ListNode{Val: arr[0]}
    current := head
    for i := 1; i < len(arr); i++ {
        current.Next = &ListNode{Val: arr[i]}
        current = current.Next
    }
    return head
}

func listToArray(head *ListNode) []int {
    var result []int
    for head != nil {
        result = append(result, head.Val)
        head = head.Next
    }
    return result
}

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    l1List := arrayToList(l1)
    l2List := arrayToList(l2)
    result := mergeTwoLists(l1List, l2List)
    fmt.Println(listToArray(result))
}""",

        "c": """#include <stdio.h>
#include <stdlib.h>

struct ListNode {
    int val;
    struct ListNode *next;
};

struct ListNode* createNode(int val) {
    struct ListNode* node = (struct ListNode*)malloc(sizeof(struct ListNode));
    node->val = val;
    node->next = NULL;
    return node;
}

struct ListNode* arrayToList(int arr[], int size) {
    if (size == 0) return NULL;
    struct ListNode* head = createNode(arr[0]);
    struct ListNode* current = head;
    for (int i = 1; i < size; i++) {
        current->next = createNode(arr[i]);
        current = current->next;
    }
    return head;
}

void printList(struct ListNode* head) {
    printf("[");
    int first = 1;
    while (head) {
        if (!first) printf(",");
        printf("%d", head->val);
        first = 0;
        head = head->next;
    }
    printf("]\\n");
}

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    struct ListNode* l1List = arrayToList(l1, l1_size);
    struct ListNode* l2List = arrayToList(l2, l2_size);
    struct ListNode* result = mergeTwoLists(l1List, l2List);
    printList(result);
    return 0;
}"""
    },

    "removeDuplicates": {  # Remove Duplicates from Sorted Array
        "python": """{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
result = removeDuplicates(nums)
print(result)""",

        "javascript": """{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const result = removeDuplicates(nums);
console.log(JSON.stringify(result));""",

        "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        int result = solution.removeDuplicates(nums);
        System.out.println(result);
    }
}""",

        "go": """package main
import "fmt"

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    result := removeDuplicates(nums)
    fmt.Println(result)
}""",

        "c": """#include <stdio.h>
#include <stdlib.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    int result = removeDuplicates(nums, numsSize);
    printf("%d\\n", result);
    return 0;
}"""
    },

    "isPalindrome": {  # Check Palindrome
        "python": """{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
result = isPalindrome(s)
print(result)""",

        "javascript": """{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const result = isPalindrome(s);
console.log(JSON.stringify(result));""",

        "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        boolean result = solution.isPalindrome(s);
        System.out.println(result);
    }
}""",

        "go": """package main
import "fmt"

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    result := isPalindrome(s)
    fmt.Println(result)
}""",

        "c": """#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    bool result = isPalindrome(s);
    printf("%s\\n", result ? "true" : "false");
    return 0;
}"""
    },
    "fib": {  # Fibonacci Number
        "python": """{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
result = fib(n)
print(result)""",

        "javascript": """{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const result = fib(n);
console.log(JSON.stringify(result));""",

        "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        int result = solution.fib(n);
        System.out.println(result);
    }
}""",

        "go": """package main
import "fmt"

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    result := fib(n)
    fmt.Println(result)
}""",

        "c": """#include <stdio.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    int result = fib(n);
    printf("%d\\n", result);
    return 0;
}"""
    },

    "factorial": {  # Factorial
        "python": """{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
result = factorial(n)
print(result)""",

        "javascript": """{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const result = factorial(n);
console.log(JSON.stringify(result));""",

        "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        int result = solution.factorial(n);
        System.out.println(result);
    }
}""",

        "go": """package main
import "fmt"

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    result := factorial(n)
    fmt.Println(result)
}""",

        "c": """#include <stdio.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    long long result = factorial(n);
    printf("%lld\\n", result);
    return 0;
}"""
    },

    "findMax": {  # Find Maximum in Array
        "python": """{{USER_CODE}}

# Test execution
{{TEST_VARIABLES}}
result = findMax(nums)
print(result)""",

        "javascript": """{{USER_CODE}}

// Test execution
{{TEST_VARIABLES}}
const result = findMax(nums);
console.log(JSON.stringify(result));""",

        "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        int result = solution.findMax(nums);
        System.out.println(result);
    }
}""",

        "go": """package main
import "fmt"

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    result := findMax(nums)
    fmt.Println(result)
}""",

        "c": """#include <stdio.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    int result = findMax(nums, numsSize);
    printf("%d\\n", result);
    return 0;
}"""
    }
}
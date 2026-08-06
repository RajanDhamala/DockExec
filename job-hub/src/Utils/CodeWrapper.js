const languageWrappers = {
  javascript: (userCode, testCases, functionName) => `
${userCode}

const testCases = ${JSON.stringify(testCases)};

function parseInput(str) {
    return eval('(' + str + ')'); // ️ sandboxing needed in production!
}

const results = [];

for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
        const inputs = parseInput('({' + tc.input + '})');
        const output = ${functionName}(...Object.values(inputs));
        const status = JSON.stringify(output) === tc.expected ? 'PASS' : 'FAIL';
        results.push({ testCase: i+1, status, expected: tc.expected, got: JSON.stringify(output) });
    } catch (err) {
        results.push({ testCase: i+1, status: 'ERROR', error: err.toString() });
    }
}

console.log(JSON.stringify(results));
`,

  python: (userCode, testCases, functionName) => `
${userCode}

testCases = ${JSON.stringify(testCases)}

import json

results = []

for i, tc in enumerate(testCases, 1):
    try:
        local_vars = {}
        exec(tc['input'], {}, local_vars)
        output = ${functionName}(**local_vars)
        status = 'PASS' if str(output) == tc['expected'] else 'FAIL'
        results.append({'testCase': i, 'status': status, 'expected': tc['expected'], 'got': str(output)})
    except Exception as e:
        results.append({'testCase': i, 'status': 'ERROR', 'error': str(e)})

print(json.dumps(results))
`,

  java: (userCode, testCases, functionName) => `
${userCode}

import java.util.*;

public class Wrapper {
    public static void main(String[] args) {
        Object[][] testCases = ${JSON.stringify(testCases.map(tc => {
          // each test case as array of input values + expected
          const inputs = tc.input.split(',').map(i => i.split('=')[1].trim());
          return `[${inputs.join(',')}, ${tc.expected}]`;
        }))};

        for (int i = 0; i < testCases.length; i++) {
            Object[] tc = testCases[i];
            try {
                Object result = ${functionName}(${/* pass tc[0..n-1] as arguments */'tc'}); // adapt later
                Object expected = tc[tc.length-1];
                System.out.println("Test " + (i+1) + ": " + (result.equals(expected) ? "PASS" : "FAIL"));
            } catch(Exception e) {
                System.out.println("Test " + (i+1) + " ERROR");
                e.printStackTrace();
            }
        }
    }
}
`,

  go: (userCode, testCases, functionName) => `
package main

import (
    "fmt"
    "reflect"
)

${userCode}

func main() {
    testCases := []struct{
        inputs []interface{}
        expected interface{}
    }{
        ${testCases.map(tc => `{inputs: []interface{}{${tc.input.split(',').map(i=>i.split('=')[1].trim()).join(',')}}, expected: ${tc.expected}}`).join(',\n')}
    }

    for i, tc := range testCases {
        result := ${functionName}(tc.inputs...) // adjust types in actual implementation
        pass := reflect.DeepEqual(result, tc.expected)
        fmt.Printf("Test %d: %v\\n", i+1, pass)
    }
}
`,

  c: (userCode, testCases, functionName) => `
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

${userCode}

int main() {
    // Define test cases
    // You need to generate proper input arrays and expected values
    printf("C wrapper requires manual input adaptation per function type.\\n");
    return 0;
}
`
};
export default languageWrappers 
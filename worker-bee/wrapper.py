# wrapper.py

# Template for all simple problems
SIMPLE_WRAPPER_TEMPLATE = {
    "python": """{{USER_CODE}}

{{TEST_VARIABLES}}
result = {{FUNCTION_CALL}}
print(result)""",

    "javascript": """{{USER_CODE}}

{{TEST_VARIABLES}}
const result = {{FUNCTION_CALL}};
console.log(JSON.stringify(result));""",

    "java": """import java.util.*;

{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        {{TEST_VARIABLES}}
        var result = solution.{{FUNCTION_CALL}};
        if (result != null && result.getClass().isArray()) {
            System.out.println(Arrays.deepToString(new Object[]{result}));
        } else {
            System.out.println(result);
        }
    }
}""",

    "go": """package main
import "fmt"

{{USER_CODE}}

func main() {
    {{TEST_VARIABLES}}
    result := {{FUNCTION_CALL}}
    fmt.Println(result)
}""",

    "c": """#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

{{USER_CODE}}

int main() {
    {{TEST_VARIABLES}}
    {{FUNCTION_CALL_C}}
    return 0;
}"""
}

# Template for LinkedList problems (placeholder for now)
LINKEDLIST_WRAPPER_TEMPLATE = {
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
    result = []
    while head:
        result.append(head.val)
        head = head.next
    return result

{{USER_CODE}}

{{LINKEDLIST_CONVERSIONS}}
result = {{FUNCTION_CALL}}
print(list_to_array(result))""",

    "javascript": """function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
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
    let result = [];
    while (head) {
        result.push(head.val);
        head = head.next;
    }
    return result;
}

{{USER_CODE}}

{{LINKEDLIST_CONVERSIONS}}
const result = {{FUNCTION_CALL}};
console.log(JSON.stringify(listToArray(result)));"""
}
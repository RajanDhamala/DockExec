import asyncHandler from "../Utils/AsyncHandler.js";
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import Problem from "../Schemas/CodeSchema.js"
import { RedisClient } from "../Utils/RedisClient.js"
import { getRabbit, RabbitChannel } from "../Utils/ConnectRabbit.js";
import { v4 as uuidv4 } from 'uuid';
import { IncreaseToken } from "../Utils/TokenCounter.js";
import Feedback from "../Schemas/FeedbackSchema.js"

const RabbitClient = await getRabbit()
const execCode = asyncHandler(async (req, res) => {
  const user = req.user;
  const { code, language, socketId } = req.body;

  if (!code || !language) {
    throw new ApiError(400, "Include language and code in request");
  }

  const uuid = uuidv4()
  try {
    const message = {
      code,
      language,
      "id": uuid,
      "socketId": socketId,
      "userId": req.user.id,
      type: "normal",
      createdAt: Date.now()
    }
    await RabbitChannel.publish(
      "code_exchange",
      "programiz_submission",
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    console.log("Job produced successfully");
    const activity = {
      userId: user.id,
      activity: {
        title: `programmiz ${language} execution`,
        description: "Just now executed code",
        status: "success",
        browserMeta: {},
        atTime: Date.now(),
      }
    };
    await RabbitClient.sendToQueue("Activity_Logs", Buffer.from(JSON.stringify(activity)), { persistent: true })

    await RedisClient.set(`exec:${uuid}`, JSON.stringify({ code, language, id: uuid, socketId, userId: user.id }),
      { EX: 120 }
    );

    await IncreaseToken(req.user.id, req.tokenCount ?? 0, req.route.path)

  } catch (error) {
    console.log("Failed to produce job:", error);
    throw new ApiError(400, "Failed to produce job for code execution");
  }
  return res.send(
    new ApiResponse(200, "Successfully produced job for code execution", uuid)
  );
});


const handleFeedback = asyncHandler(async (req, res) => {
  const { title, description } = req.body

  if (!title || !description) {
    throw new ApiError(400, null, "inlcude title and description in req")
  }

  const ImagesUrl = req.body.imageUrls
  console.log("images url:", ImagesUrl)
  if (!ImagesUrl || ImagesUrl.length == 0) {
    console.log("user has provided no img btw")
  }
  console.log("user submitted review:", title, description)
  try {
    await Feedback.create({
      title: title,
      description: description,
      images: ImagesUrl
    })
  } catch (err) {
    console.log("filed to udpate db")
    throw new ApiError(500, null, "internal server error")
  }
  return res.send(new ApiResponse(200, "successfully submitted feedback"))
})


const migratedb = asyncHandler(async (req, res) => {
  const postdata = [
    {
      "id": 1,
      "title": "Two Sum",
      "difficulty": "Easy",
      "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      "function_name": "twoSum",
      "parameters": ["nums", "target"],
      "wrapper_type": "simple",
      "examples": [
        {
          "input": "nums = [2,7,11,15], target = 9",
          "output": "[0,1]",
          "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
        },
        {
          "input": "nums = [3,2,4], target = 6",
          "output": "[1,2]"
        }
      ],
      "constraints": [
        "2 <= nums.length <= 10⁴",
        "-10⁹ <= nums[i] <= 10⁹",
        "-10⁹ <= target <= 10⁹",
        "Only one valid answer exists."
      ],
      "testCases": [
        {
          "input": "nums = [2,7,11,15], target = 9",
          "expected": "[0,1]"
        },
        {
          "input": "nums = [3,2,4], target = 6",
          "expected": "[1,2]"
        },
        {
          "input": "nums = [3,3], target = 6",
          "expected": "[0,1]"
        },
        {
          "input": "nums = [1,2,3,4,5], target = 9",
          "expected": "[3,4]"
        }
      ],
      "codeTemplate": {
        "python": "def twoSum(nums, target): \"\"\"\":type nums: List[int\n      ]\n    :type target: int\n    :rtype: List[int\n      ]\n    \"\"\"\n    # Write your solution here\n    pass",
        "javascript": "var twoSum = function(nums, target) {\n        // Write your solution here\n      };",
        "go": "func twoSum(nums []int, target int) []int {\n        // Write your solution here\n    return nil\n      }",
        "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n          // Write your solution here\n        return new int[]{};\n        }\n      }",
        "c": "int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n        // Write your solution here\n    *returnSize = 2;\n    return NULL;\n      }"
      }
    },
    {
      "id": 2,
      "title": "Add Two Numbers",
      "difficulty": "Medium",
      "description": "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
      "function_name": "addTwoNumbers",
      "parameters": ["l1", "l2"],
      "wrapper_type": "custom",
      "examples": [
        {
          "input": "l1 = [2,4,3], l2 = [5,6,4]",
          "output": "[7,0,8]",
          "explanation": "342 + 465 = 807."
        }
      ],
      "constraints": [
        "The number of nodes in each linked list is in the range [1, 100].",
        "0 <= Node.val <= 9"
      ],
      "testCases": [
        {
          "input": "l1 = [2,4,3], l2 = [5,6,4]",
          "expected": "[7,0,8]"
        },
        {
          "input": "l1 = [0], l2 = [0]",
          "expected": "[0]"
        },
        {
          "input": "l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]",
          "expected": "[8,9,9,9,0,0,0,1]"
        }
      ],
      "codeTemplate": {
        "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n\ndef addTwoNumbers(l1, l2):\n    # Write your solution here\n    pass",
        "javascript": "function ListNode(val, next) {\n    this.val = (val===undefined ? 0 : val)\n    this.next = (next===undefined ? null : next)\n      }\n\nvar addTwoNumbers = function(l1, l2) {\n        // Write your solution here\n      };",
        "go": "type ListNode struct {\n    Val int\n    Next *ListNode\n      }\n\nfunc addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {\n        // Write your solution here\n    return nil\n      }",
        "java": "class ListNode {\n    int val;\n    ListNode next;\n    ListNode() {}\n    ListNode(int val) { this.val = val;\n        }\n    ListNode(int val, ListNode next) { this.val = val; this.next = next;\n        }\n      }\n\nclass Solution {\n    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {\n          // Write your solution here\n        return null;\n        }\n      }",
        "c": "struct ListNode {\n    int val;\n    struct ListNode *next;\n      };\n\nstruct ListNode* addTwoNumbers(struct ListNode* l1, struct ListNode* l2) {\n        // Write your solution here\n    return NULL;\n      }"
      }
    },
    {
      "id": 3,
      "title": "Longest Substring Without Repeating Characters",
      "difficulty": "Medium",
      "description": "Given a string s, find the length of the longest substring without repeating characters.",
      "function_name": "lengthOfLongestSubstring",
      "parameters": ["s"],
      "wrapper_type": "simple",
      "examples": [
        {
          "input": "s = \"abcabcbb\"",
          "output": "3",
          "explanation": "The answer is \"abc\", with the length of 3."
        },
        {
          "input": "s = \"bbbbb\"",
          "output": "1",
          "explanation": "The answer is \"b\", with the length of 1."
        }
      ],
      "constraints": [
        "0 <= s.length <= 5 * 10⁴",
        "s consists of English letters, digits, symbols and spaces."
      ],
      "testCases": [
        {
          "input": "s = \"abcabcbb\"",
          "expected": "3"
        },
        {
          "input": "s = \"bbbbb\"",
          "expected": "1"
        },
        {
          "input": "s = \"pwwkew\"",
          "expected": "3"
        },
        {
          "input": "s = \"\"",
          "expected": "0"
        }
      ],
      "codeTemplate": {
        "python": "def lengthOfLongestSubstring(s):\n    # Write your solution here\n    pass",
        "javascript": "var lengthOfLongestSubstring = function(s) {\n        // Write your solution here\n      };",
        "go": "func lengthOfLongestSubstring(s string) int {\n        // Write your solution here\n    return 0\n      }",
        "java": "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n          // Write your solution here\n        return 0;\n        }\n      }",
        "c": "int lengthOfLongestSubstring(char* s) {\n        // Write your solution here\n    return 0;\n      }"
      }
    },
    {
      "id": 4,
      "title": "Median of Two Sorted Arrays",
      "difficulty": "Hard",
      "description": "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).",
      "function_name": "findMedianSortedArrays",
      "parameters": ["nums1", "nums2"],
      "wrapper_type": "simple",
      "examples": [
        {
          "input": "nums1 = [1,3], nums2 = [2]",
          "output": "2.00000",
          "explanation": "merged array = [1,2,3] and median is 2."
        }
      ],
      "constraints": [
        "nums1.length == m",
        "nums2.length == n",
        "0 <= m <= 1000",
        "0 <= n <= 1000"
      ],
      "testCases": [
        {
          "input": "nums1 = [1,3], nums2 = [2]",
          "expected": "2.00000"
        },
        {
          "input": "nums1 = [1,2], nums2 = [3,4]",
          "expected": "2.50000"
        },
        {
          "input": "nums1 = [0,0], nums2 = [0,0]",
          "expected": "0.00000"
        }
      ],
      "codeTemplate": {
        "python": "def findMedianSortedArrays(nums1, nums2):\n    # Write your solution here\n    pass",
        "javascript": "var findMedianSortedArrays = function(nums1, nums2) {\n        // Write your solution here\n      };",
        "go": "func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {\n        // Write your solution here\n    return 0.0\n      }",
        "java": "class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n          // Write your solution here\n        return 0.0;\n        }\n      }",
        "c": "double findMedianSortedArrays(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n        // Write your solution here\n    return 0.0;\n      }"
      }
    },
    {
      "id": 5,
      "title": "Reverse a Linked List",
      "difficulty": "Easy",
      "description": "Given the head of a singly linked list, reverse the list and return the reversed list.",
      "function_name": "reverseList",
      "parameters": ["head"],
      "wrapper_type": "custom",
      "examples": [
        {
          "input": "head = [1,2,3,4,5]",
          "output": "[5,4,3,2,1]",
          "explanation": "The original linked list 1→2→3→4→5 is reversed to 5→4→3→2→1. Each node now points to its previous node."
        },
        {
          "input": "head = [1,2]",
          "output": "[2,1]",
          "explanation": "The linked list 1→2 is reversed to 2→1. The head becomes the tail, and the last node becomes the new head."
        }
      ],
      "constraints": [
        "The number of nodes in the list is in the range [0, 5000]",
        "-5000 <= Node.val <= 5000"
      ],
      "testCases": [
        {
          "input": "head = [1,2,3,4,5]",
          "expected": "[5,4,3,2,1]"
        },
        {
          "input": "head = [1,2]",
          "expected": "[2,1]"
        },
        {
          "input": "head = []",
          "expected": "[]"
        }
      ],
      "codeTemplate": {
        "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n\ndef reverseList(head):\n    # Write your solution here\n    pass",
        "javascript": "function ListNode(val, next) {\n    this.val = val || 0;\n    this.next = next || null;\n      }\n\nvar reverseList = function(head) {\n        // Write your solution here\n      };",
        "go": "type ListNode struct {\n    Val int\n    Next *ListNode\n      }\n\nfunc reverseList(head *ListNode) *ListNode {\n        // Write your solution here\n    return nil\n      }",
        "java": "class ListNode {\n    int val;\n    ListNode next;\n    ListNode() {}\n    ListNode(int val) { this.val = val;\n        }\n    ListNode(int val, ListNode next) { this.val = val; this.next = next;\n        }\n      }\n\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n          // Write your solution here\n        return null;\n        }\n      }",
        "c": "struct ListNode {\n    int val;\n    struct ListNode *next;\n};\n\nstruct ListNode* reverseList(struct ListNode* head) {\n    // Write your solution here\n    return NULL;\n}"
      }
    },
    {
      "id": 6,
      "title": "Sort an Array",
      "difficulty": "Easy",
      "description": "Given an array of integers, sort the array in ascending order and return it.",
      "function_name": "sortArray",
      "parameters": ["nums"],
      "wrapper_type": "simple",
      "examples": [
        {
          "input": "nums = [5,2,3,1]",
          "output": "[1,2,3,5]",
          "explanation": "The input array [5,2,3,1] is sorted in ascending order to produce [1,2,3,5]."
        },
        {
          "input": "nums = [5,1,1,2,0,0]",
          "output": "[0,0,1,1,2,5]",
          "explanation": "The input array [5,1,1,2,0,0] is sorted in ascending order to produce [0,0,1,1,2,5]."
        }
      ],
      "constraints": [
        "1 <= nums.length <= 10^5",
        "-10^5 <= nums[i] <= 10^5"
      ],
      "testCases": [
        {
          "input": "nums = [5,2,3,1]",
          "expected": "[1,2,3,5]"
        },
        {
          "input": "nums = [5,1,1,2,0,0]",
          "expected": "[0,0,1,1,2,5]"
        },
        {
          "input": "nums = []",
          "expected": "[]"
        }
      ],
      "codeTemplate": {
        "python": "def sortArray(nums):\n    # Write your solution here\n    pass",
        "javascript": "var sortArray = function(nums) {\n        // Write your solution here\n      };",
        "go": "func sortArray(nums []int) []int {\n        // Write your solution here\n    return nums\n      }",
        "java": "class Solution {\n    public int[] sortArray(int[] nums) {\n          // Write your solution here\n        return nums;\n        }\n      }",
        "c": "int* sortArray(int* nums, int numsSize){\n        // Write your solution here\n    return nums;\n      }"
      }
    },
    {
      "id": 7,
      "title": "Reverse a String",
      "difficulty": "Easy",
      "description": "Write a function that reverses a string. The input string is given as an array of characters.",
      "function_name": "reverseString",
      "parameters": ["s"],
      "wrapper_type": "custom",
      "examples": [
        {
          "input": "s = ['h','e','l','l','o']",
          "output": "['o','l','l','e','h']",
          "explanation": "The string ['h','e','l','l','o'] is reversed to ['o','l','l','e','h']."
        },
        {
          "input": "s = ['H','a','n','n','a','h']",
          "output": "['h','a','n','n','a','H']",
          "explanation": "The string ['H','a','n','n','a','h'] is reversed to ['h','a','n','n','a','H']."
        }
      ],
      "constraints": [
        "1 <= s.length <= 10^5",
        "s[i] is a printable ASCII character."
      ],
      "testCases": [
        {
          "input": "s = ['h','e','l','l','o']",
          "expected": "['o','l','l','e','h']"
        },
        {
          "input": "s = ['H','a','n','n','a','h']",
          "expected": "['h','a','n','n','a','H']"
        },
        {
          "input": "s = ['a']",
          "expected": "['a']"
        },
        {
          "input": "s = []",
          "expected": "[]"
        }
      ],
      "codeTemplate": {
        "python": "def reverseString(s):\n    # Write your solution here\n    pass",
        "javascript": "var reverseString = function(s) {\n        // Write your solution here\n      };",
        "go": "func reverseString(s []byte) {\n        // Write your solution here\n      }",
        "java": "class Solution {\n    public void reverseString(char[] s) {\n          // Write your solution here\n        }\n      }",
        "c": "void reverseString(char* s, int sSize) {\n        // Write your solution here\n      }"
      }
    },
    {
      "id": 8,
      "title": "Check Armstrong Number",
      "difficulty": "Easy",
      "description": "An Armstrong number of order n is a number that is equal to the sum of its digits raised to the power n. Determine if a given number is an Armstrong number.",
      "function_name": "isArmstrong",
      "parameters": ["n"],
      "wrapper_type": "simple",
      "examples": [
        {
          "input": "n = 153",
          "output": "true",
          "explanation": "153 has 3 digits, and 1^3 + 5^3 + 3^3 = 153, so it is an Armstrong number."
        },
        {
          "input": "n = 123",
          "output": "false",
          "explanation": "123 has 3 digits, and 1^3 + 2^3 + 3^3 = 36, which is not equal to 123."
        }
      ],
      "constraints": [
        "0 <= n <= 10^9"
      ],
      "testCases": [
        {
          "input": "n = 153",
          "expected": "true"
        },
        {
          "input": "n = 123",
          "expected": "false"
        },
        {
          "input": "n = 9474",
          "expected": "true"
        },
        {
          "input": "n = 0",
          "expected": "true"
        }
      ],
      "codeTemplate": {
        "python": "def isArmstrong(n):\n    # Write your solution here\n    pass",
        "javascript": "var isArmstrong = function(n) {\n        // Write your solution here\n      };",
        "go": "func isArmstrong(n int) bool {\n        // Write your solution here\n    return false\n      }",
        "java": "class Solution {\n    public boolean isArmstrong(int n) {\n          // Write your solution here\n        return false;\n        }\n      }",
        "c": "bool isArmstrong(int n) {\n        // Write your solution here\n    return false;\n      }"
      }
    },
    {
      "id": 9,
      "title": "Merge Two Sorted Linked Lists",
      "difficulty": "Medium",
      "description": "Merge two sorted linked lists and return it as a new sorted list.",
      "function_name": "mergeTwoLists",
      "parameters": ["l1", "l2"],
      "wrapper_type": "custom",
      "examples": [
        {
          "input": "l1 = [1,2,4], l2 = [1,3,4]",
          "output": "[1,1,2,3,4,4]",
          "explanation": "Merging the two sorted lists [1,2,4] and [1,3,4] results in [1,1,2,3,4,4]."
        }
      ],
      "constraints": [
        "Number of nodes in each list: [0, 50]"
      ],
      "testCases": [
        {
          "input": "l1 = [1,2,4], l2 = [1,3,4]",
          "expected": "[1,1,2,3,4,4]"
        },
        {
          "input": "l1 = [], l2 = []",
          "expected": "[]"
        },
        {
          "input": "l1 = [], l2 = [0]",
          "expected": "[0]"
        },
        {
          "input": "l1 = [5], l2 = [1,2,3,4]",
          "expected": "[1,2,3,4,5]"
        }
      ],
      "codeTemplate": {
        "python": "def mergeTwoLists(l1, l2):\n    # Write your solution here\n    pass",
        "javascript": "var mergeTwoLists = function(l1, l2) {\n        // Write your solution here\n      };",
        "go": "func mergeTwoLists(l1 *ListNode, l2 *ListNode) *ListNode {\n        // Write your solution here\n    return nil\n      }",
        "java": "class Solution {\n    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {\n          // Write your solution here\n        return null;\n        }\n      }",
        "c": "struct ListNode* mergeTwoLists(struct ListNode* l1, struct ListNode* l2) {\n        // Write your solution here\n    return NULL;\n      }"
      }
    },
    {
      "id": 10,
      "title": "Remove Duplicates from Sorted Array",
      "difficulty": "Easy",
      "description": "Given a sorted array, remove the duplicates in-place such that each element appears only once and return the new length.",
      "function_name": "removeDuplicates",
      "parameters": ["nums"],
      "wrapper_type": "simple",
      "examples": [
        {
          "input": "nums = [1,1,2]",
          "output": "2",
          "explanation": "After removing duplicates, the array [1,1,2] becomes [1,2], and the new length is 2."
        }
      ],
      "constraints": [
        "0 <= nums.length <= 3 * 10^4",
        "-10^4 <= nums[i] <= 10^4"
      ],
      "testCases": [
        {
          "input": "nums = [1,1,2]",
          "expected": "2"
        },
        {
          "input": "nums = [0,0,1,1,1,2,2,3,3,4]",
          "expected": "5"
        },
        {
          "input": "nums = []",
          "expected": "0"
        }
      ],
      "codeTemplate": {
        "python": "def removeDuplicates(nums):\n    # Write your solution here\n    pass",
        "javascript": "var removeDuplicates = function(nums) {\n        // Write your solution here\n      };",
        "go": "func removeDuplicates(nums []int) int {\n        // Write your solution here\n    return 0\n      }",
        "java": "class Solution {\n    public int removeDuplicates(int[] nums) {\n          // Write your solution here\n        return 0;\n        }\n      }",
        "c": "int removeDuplicates(int* nums, int numsSize) {\n        // Write your solution here\n    return 0;\n      }"
      }
    },
    {
      "id": 11,
      "title": "Check Palindrome",
      "difficulty": "Easy",
      "description": "Given a string, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.",
      "function_name": "isPalindrome",
      "parameters": ["s"],
      "wrapper_type": "simple",
      "examples": [
        {
          "input": "s = \"A man, a plan, a canal: Panama\"",
          "output": "true",
          "explanation": "Ignoring non-alphanumeric characters and case, the string reads the same forwards and backwards."
        },
        {
          "input": "s = \"race a car\"",
          "output": "false",
          "explanation": "Ignoring spaces, the string does not read the same forwards and backwards."
        }
      ],
      "constraints": [
        "1 <= s.length <= 2 * 10^5",
        "s consists of printable ASCII characters."
      ],
      "testCases": [
        {
          "input": "s = \"A man, a plan, a canal: Panama\"",
          "expected": "true"
        },
        {
          "input": "s = \"race a car\"",
          "expected": "false"
        },
        {
          "input": "s = \" \"",
          "expected": "true"
        },
        {
          "input": "s = \"No lemon, no melon\"",
          "expected": "true"
        }
      ],
      "codeTemplate": {
        "python": "def isPalindrome(s):\n    # Write your solution here\n    pass",
        "javascript": "var isPalindrome = function(s) {\n        // Write your solution here\n      };",
        "go": "func isPalindrome(s string) bool {\n        // Write your solution here\n    return false\n      }",
        "java": "class Solution {\n    public boolean isPalindrome(String s) {\n          // Write your solution here\n        return false;\n        }\n      }",
        "c": "bool isPalindrome(char* s) {\n        // Write your solution here\n    return false;\n      }"
      }
    },
    {
      "id": 12,
      "title": "Fibonacci Number",
      "difficulty": "Easy",
      "description": "Given n, calculate the nth Fibonacci number. The Fibonacci sequence is defined as F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2).",
      "function_name": "fib",
      "parameters": ["n"],
      "wrapper_type": "simple",
      "examples": [
        {
          "input": "n = 2",
          "output": "1",
          "explanation": "F(2) = F(1) + F(0) = 1 + 0 = 1"
        },
        {
          "input": "n = 10",
          "output": "55",
          "explanation": "F(10) = 55"
        }
      ],
      "constraints": [
        "0 <= n <= 30"
      ],
      "testCases": [
        {
          "input": "n = 2",
          "expected": "1"
        },
        {
          "input": "n = 10",
          "expected": "55"
        },
        {
          "input": "n = 0",
          "expected": "0"
        },
        {
          "input": "n = 1",
          "expected": "1"
        }
      ],
      "codeTemplate": {
        "python": "def fib(n):\n    # Write your solution here\n    pass",
        "javascript": "var fib = function(n) {\n        // Write your solution here\n      };",
        "go": "func fib(n int) int {\n        // Write your solution here\n    return 0\n      }",
        "java": "class Solution {\n    public int fib(int n) {\n          // Write your solution here\n        return 0;\n        }\n      }",
        "c": "int fib(int n) {\n        // Write your solution here\n    return 0;\n      }"
      }
    },
    {
      "id": 13,
      "title": "Factorial",
      "difficulty": "Easy",
      "description": "Calculate the factorial of a given non-negative integer n, i.e., n! = n * (n-1) * ... * 1.",
      "function_name": "factorial",
      "parameters": ["n"],
      "wrapper_type": "simple",
      "examples": [
        {
          "input": "n = 5",
          "output": "120",
          "explanation": "5! = 5 * 4 * 3 * 2 * 1 = 120"
        },
        {
          "input": "n = 0",
          "output": "1",
          "explanation": "0! is defined as 1"
        }
      ],
      "constraints": [
        "0 <= n <= 20"
      ],
      "testCases": [
        {
          "input": "n = 5",
          "expected": "120"
        },
        {
          "input": "n = 0",
          "expected": "1"
        },
        {
          "input": "n = 3",
          "expected": "6"
        },
        {
          "input": "n = 10",
          "expected": "3628800"
        }
      ],
      "codeTemplate": {
        "python": "def factorial(n):\n    # Write your solution here\n    pass",
        "javascript": "var factorial = function(n) {\n        // Write your solution here\n      };",
        "go": "func factorial(n int) int {\n        // Write your solution here\n    return 0\n      }",
        "java": "class Solution {\n    public int factorial(int n) {\n          // Write your solution here\n        return 0;\n        }\n      }",
        "c": "long long factorial(int n) {\n        // Write your solution here\n    return 0;\n      }"
      }
    },
    {
      "id": 14,
      "title": "Find Maximum in Array",
      "difficulty": "Easy",
      "description": "Given an array of integers, find and return the maximum element.",
      "function_name": "findMax",
      "parameters": ["nums"],
      "wrapper_type": "simple",
      "examples": [
        {
          "input": "nums = [1,3,2,5,4]",
          "output": "5",
          "explanation": "The maximum value in the array [1,3,2,5,4] is 5"
        },
        {
          "input": "nums = [-10,-3,-1,-7]",
          "output": "-1",
          "explanation": "The maximum value in the array [-10,-3,-1,-7] is -1"
        }
      ],
      "constraints": [
        "1 <= nums.length <= 10^5",
        "-10^9 <= nums[i] <= 10^9"
      ],
      "testCases": [
        {
          "input": "nums = [1,3,2,5,4]",
          "expected": "5"
        },
        {
          "input": "nums = [-10,-3,-1,-7]",
          "expected": "-1"
        },
        {
          "input": "nums = [100]",
          "expected": "100"
        },
        {
          "input": "nums = [0,0,0]",
          "expected": "0"
        }
      ],
      "codeTemplate": {
        "python": "def findMax(nums):\n    # Write your solution here\n    pass",
        "javascript": "var findMax = function(nums) {\n        // Write your solution here\n      };",
        "go": "func findMax(nums []int) int {\n        // Write your solution here\n    return 0\n      }",
        "java": "class Solution {\n    public int findMax(int[] nums) {\n          // Write your solution here\n        return 0;\n        }\n      }",
        "c": "int findMax(int* nums, int numsSize) {\n        // Write your solution here\n    return 0;\n      }"
      }
    },
    {
      "id": 15,
      "title": "Implement Stack and Queue",
      "difficulty": "Medium",
      "description": "Implement a simple Stack and Queue data structure with basic operations. Stack should support push, pop, and top. Queue should support enqueue, dequeue, and peek.",
      "function_name": "MyStack", // This is tricky - multiple classes
      "parameters": ["operations"], // Custom handling needed
      "wrapper_type": "custom",
      "examples": [
        {
          "input": "Stack: push(1), push(2), pop(), top()",
          "output": "1",
          "explanation": "Push 1 and 2 to the stack, pop removes 2, top returns 1"
        },
        {
          "input": "Queue: enqueue(1), enqueue(2), dequeue(), peek()",
          "output": "2",
          "explanation": "Enqueue 1 and 2 to the queue, dequeue removes 1, peek returns 2"
        }
      ],
      "constraints": [
        "All operations will be valid.",
        "Number of operations <= 1000"
      ],
      "testCases": [
        {
          "input": "Stack: push(1), push(2), pop(), top()",
          "expected": "1"
        },
        {
          "input": "Stack: push(3), pop(), pop()",
          "expected": "empty"
        },
        {
          "input": "Queue: enqueue(1), enqueue(2), dequeue(), peek()",
          "expected": "2"
        },
        {
          "input": "Queue: enqueue(5), dequeue(), dequeue()",
          "expected": "empty"
        }
      ],
      "codeTemplate": {
        "python": "class MyStack:\n    def __init__(self):\n        # initialize stack\n        pass\n    \n    def push(self, x):\n        pass\n\n    def pop(self):\n        pass\n\n    def top(self):\n        pass\n\n    def empty(self):\n        pass\n\nclass MyQueue:\n    def __init__(self):\n        # initialize queue\n        pass\n    \n    def enqueue(self, x):\n        pass\n\n    def dequeue(self):\n        pass\n\n    def peek(self):\n        pass\n\n    def empty(self):\n        pass",
        "javascript": "class MyStack {\n    constructor() {\n          // initialize stack\n        }\n\n    push(x) {\n          // write code\n        }\n\n    pop() {\n          // write code\n        }\n\n    top() {\n          // write code\n        }\n\n    empty() {\n          // write code\n        }\n      }\n\nclass MyQueue {\n    constructor() {\n          // initialize queue\n        }\n\n    enqueue(x) {\n          // write code\n        }\n\n    dequeue() {\n          // write code\n        }\n\n    peek() {\n          // write code\n        }\n\n    empty() {\n          // write code\n        }\n      }",
        "go": "type MyStack struct {\n        // define stack\n      }\n\nfunc (s *MyStack) Push(x int) {}\nfunc (s *MyStack) Pop() int { return 0\n      }\nfunc (s *MyStack) Top() int { return 0\n      }\nfunc (s *MyStack) Empty() bool { return true\n      }\n\ntype MyQueue struct {\n        // define queue\n      }\n\nfunc (q *MyQueue) Enqueue(x int) {}\nfunc (q *MyQueue) Dequeue() int { return 0\n      }\nfunc (q *MyQueue) Peek() int { return 0\n      }\nfunc (q *MyQueue) Empty() bool { return true\n      }",
        "java": "class MyStack {\n    public MyStack() {\n          // initialize stack\n        }\n\n    public void push(int x) {}\n    public int pop() { return 0;\n        }\n    public int top() { return 0;\n        }\n    public boolean empty() { return true;\n        }\n      }\n\nclass MyQueue {\n    public MyQueue() {\n          // initialize queue\n        }\n\n    public void enqueue(int x) {}\n    public int dequeue() { return 0;\n        }\n    public int peek() { return 0;\n        }\n    public boolean empty() { return true;\n        }\n      }",
        "c": "typedef struct {\n        // define stack\n      } MyStack;\n\nvoid push(MyStack* obj, int x) {}\nint pop(MyStack* obj) { return 0;\n      }\nint top(MyStack* obj) { return 0;\n      }\nbool emptyStack(MyStack* obj) { return true;\n      }\n\ntypedef struct {\n        // define queue\n      } MyQueue;\n\nvoid enqueue(MyQueue* obj, int x) {}\nint dequeue(MyQueue* obj) { return 0;\n      }\nint peek(MyQueue* obj) { return 0;\n      }\nbool emptyQueue(MyQueue* obj) { return true;\n      }"
      }
    }
  ]

  try {
    const inserted = [];

    for (const prob of postdata) {
      // DEBUG: Log what we're trying to insert
      console.log("Processing problem:", prob.title);
      console.log("Function name:", prob.function_name);
      console.log("Parameters:", prob.parameters);
      console.log("Wrapper type:", prob.wrapper_type);

      // Check if required fields exist
      if (!prob.function_name) {
        console.error(` Missing function_name for problem: ${prob.title}`);
        continue; // Skip this problem
      }

      const problem = await Problem.create({
        title: prob.title,
        difficulty: prob.difficulty,
        description: prob.description,
        examples: (prob.examples ?? []).map(item => ({
          input: item.input,
          output: item.output,
          explanation: item.explanation ?? ""
        })),
        function_name: prob.function_name,
        parameters: prob.parameters ?? [],
        wrapper_type: prob.wrapper_type ?? "simple", // Add default
        constraints: prob.constraints ?? [],
        testCases: (prob.testCases ?? []).map(tc => ({
          input: tc.input,
          expected: tc.expected
        })),
        languageTemplates: prob.codeTemplate
      });

      inserted.push(problem._id);
      console.log(` Inserted: ${prob.title}`);
    }

    console.log("Successfully inserted problem IDs:", inserted);
    return res.status(201).json(new ApiResponse(201, inserted, "DB initialized with problems"));

  } catch (err) {
    console.error("Failed to insert problems:", err);
    return res.status(500).json(new ApiResponse(500, null, "Failed to init DB"));
  }
})

export { execCode, handleFeedback, migratedb };

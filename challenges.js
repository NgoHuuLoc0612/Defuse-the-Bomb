//AI Challenge Generator for All Wires

class BombChallenges {
    constructor() {
        this.apiKey = null;
        this.solutions = {};
        this.challengeTypes = {
            red: [
                'mathematical riddles and brain teasers',
                'logic puzzles and deduction problems', 
                'number theory and sequences',
                'probability and statistics challenges',
                'geometric and spatial reasoning'
            ],
            blue: [
                'sorting and searching algorithms',
                'data structures (arrays, stacks, queues)',
                'time complexity and Big O notation',
                'recursive algorithms and dynamic programming',
                'hash tables and binary operations'
            ],
            green: [
                'programming logic and pseudocode',
                'conditional statements and loops',
                'function analysis and debugging',
                'variable manipulation and scope',
                'algorithmic thinking and problem decomposition'
            ],
            yellow: [
                'cryptography and cipher techniques',
                'encoding and decoding methods',
                'security protocols and authentication',
                'hash functions and digital signatures',
                'steganography and information hiding'
            ],
            purple: [
                'graph theory and network analysis',
                'tree algorithms and traversal methods',
                'shortest path and optimization problems',
                'advanced algorithms (Dijkstra, A*, etc)',
                'complexity theory and NP problems'
            ]
        };
        
        this.fallbackChallenges = this.initializeFallbacks();
    }

    setApiKey(key) {
        this.apiKey = key;
        console.log('🔑 API Key configured for dynamic challenges');
    }

    // ================== MAIN CHALLENGE GENERATOR ==================
    async generateChallenge(wireColor) {
        const challengeTypes = this.challengeTypes[wireColor];
        const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
        
        try {
            if (this.apiKey) {
                return await this.generateAIChallenge(wireColor, randomType);
            } else {
                return this.getFallbackChallenge(wireColor);
            }
        } catch (error) {
            console.error(`Error generating ${wireColor} challenge:`, error);
            return this.getFallbackChallenge(wireColor);
        }
    }

    async generateAIChallenge(wireColor, challengeType) {
        const prompts = this.getChallengePrompts(wireColor, challengeType);
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are creating challenges for a bomb defusal game. The challenge should be about ${challengeType}. Make it moderately difficult but solvable within 2-3 minutes. Always end your response with 'ANSWER: [the exact answer]' on a new line. Keep the answer simple and clear.`
                    },
                    {
                        role: "user",
                        content: randomPrompt
                    }
                ],
                max_tokens: 300,
                temperature: 0.9
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const challengeText = data.choices[0].message.content;
        
        // Extract challenge and answer
        const parts = challengeText.split('ANSWER:');
        const challenge = parts[0].trim();
        const answer = parts[1] ? parts[1].trim().toLowerCase() : '';

        // Store solution
        this.solutions[wireColor] = answer;

        return {
            title: this.getWireTitle(wireColor, challengeType),
            challenge: challenge,
            answer: answer
        };
    }

    getChallengePrompts(wireColor, challengeType) {
        const prompts = {
            red: [
                `Create a mathematical riddle involving ${challengeType}. Make it require logical thinking and calculation.`,
                `Generate a brain teaser about ${challengeType} that needs step-by-step reasoning.`,
                `Create a puzzle involving ${challengeType} with a numerical answer.`,
                `Make a challenging problem about ${challengeType} that tests mathematical intuition.`,
                `Design a logic puzzle involving ${challengeType} with a clear solution path.`
            ],
            blue: [
                `Create a problem about ${challengeType} that requires understanding of computer science concepts.`,
                `Generate a challenge involving ${challengeType} with algorithmic thinking.`,
                `Make a question about ${challengeType} that tests programming knowledge.`,
                `Create a data structure problem involving ${challengeType}.`,
                `Design an algorithm challenge about ${challengeType} with step-by-step solution.`
            ],
            green: [
                `Create a programming logic problem about ${challengeType}.`,
                `Generate a computational thinking challenge involving ${challengeType}.`,
                `Make a problem about ${challengeType} that requires code analysis.`,
                `Create a debugging scenario involving ${challengeType}.`,
                `Design a logic flow problem about ${challengeType}.`
            ],
            yellow: [
                `Create a cryptography challenge involving ${challengeType}.`,
                `Generate a security-related puzzle about ${challengeType}.`,
                `Make an encoding/decoding problem using ${challengeType}.`,
                `Create a cipher challenge involving ${challengeType}.`,
                `Design a information security problem about ${challengeType}.`
            ],
            purple: [
                `Create an advanced algorithm problem about ${challengeType}.`,
                `Generate a graph theory challenge involving ${challengeType}.`,
                `Make a complex optimization problem using ${challengeType}.`,
                `Create a network analysis challenge about ${challengeType}.`,
                `Design a computational complexity problem involving ${challengeType}.`
            ]
        };

        return prompts[wireColor] || prompts.red;
    }

    getWireTitle(wireColor, challengeType) {
        const titles = {
            red: `🧠 ${challengeType.toUpperCase()}`,
            blue: `🔢 ${challengeType.toUpperCase()}`,
            green: `🌳 ${challengeType.toUpperCase()}`,
            yellow: `🔐 ${challengeType.toUpperCase()}`,
            purple: `📊 ${challengeType.toUpperCase()}`
        };
        return titles[wireColor] || '💡 CHALLENGE';
    }

    // ================== FALLBACK CHALLENGES ==================
    initializeFallbacks() {
        return {
            red: [
                {
                    title: '🧠 MATHEMATICAL RIDDLE',
                    challenge: 'I am a number. When you multiply me by 6 and add 12, you get 78. What number am I?',
                    answer: '11'
                },
                {
                    title: '🧠 SEQUENCE PUZZLE',
                    challenge: 'What comes next in this sequence: 1, 4, 9, 16, 25, ?',
                    answer: '36'
                },
                {
                    title: '🧠 LOGIC PROBLEM',
                    challenge: 'If 5 cats can catch 5 mice in 5 minutes, how many cats are needed to catch 100 mice in 100 minutes?',
                    answer: '5'
                },
                {
                    title: '🧠 PRIME PUZZLE',
                    challenge: 'I am the largest prime number less than 30. What number am I?',
                    answer: '29'
                },
                {
                    title: '🧠 FIBONACCI CHALLENGE',
                    challenge: 'In the Fibonacci sequence (0,1,1,2,3,5,8...), what is the 10th number?',
                    answer: '55'
                }
            ],
            blue: [
                {
                    title: '🔢 SORTING ALGORITHM',
                    challenge: 'Using Bubble Sort, how many swaps are needed to sort [3,1,4,2]?\n\nStep through each pass:\nPass 1: [3,1,4,2] → [1,3,4,2] → [1,3,2,4]\nPass 2: [1,3,2,4] → [1,2,3,4]\n\nCount the swaps.',
                    answer: '3'
                },
                {
                    title: '🔢 BINARY SEARCH',
                    challenge: 'In a sorted array [2,5,8,12,16,23,38,45,67,78], how many comparisons does binary search need to find the number 23?',
                    answer: '3'
                },
                {
                    title: '🔢 DATA STRUCTURE',
                    challenge: 'A stack has operations: PUSH(5), PUSH(3), POP(), PUSH(7), POP(), POP(). What is the final state? (Enter the remaining number, or "empty" if stack is empty)',
                    answer: 'empty'
                },
                {
                    title: '🔢 BIG O NOTATION',
                    challenge: 'What is the time complexity of finding the maximum element in an unsorted array of n elements? (Answer format: O(x))',
                    answer: 'o(n)'
                },
                {
                    title: '🔢 RECURSION',
                    challenge: 'Calculate factorial of 5 using recursion: 5! = 5 × 4!. What is the result?',
                    answer: '120'
                }
            ],
            green: [
                {
                    title: '🌳 PROGRAMMING LOGIC',
                    challenge: 'What does this pseudocode output?\n\nfor i = 1 to 4:\n    if i % 2 == 0:\n        print i * 2\n    else:\n        print i + 1\n\nEnter the output sequence (comma separated)',
                    answer: '2,4,4,8'
                },
                {
                    title: '🌳 LOOP ANALYSIS',
                    challenge: 'How many times does "Hello" get printed?\n\nfor i = 0 to 3:\n    for j = 0 to 2:\n        print "Hello"',
                    answer: '12'
                },
                {
                    title: '🌳 CONDITIONAL LOGIC',
                    challenge: 'Given: x = 15, y = 8\n\nif x > 10 AND y < 10:\n    result = x + y\nelse:\n    result = x - y\n\nWhat is the value of result?',
                    answer: '23'
                },
                {
                    title: '🌳 FUNCTION TRACING',
                    challenge: 'function mystery(n):\n    if n <= 1: return 1\n    return n * mystery(n-1)\n\nWhat is mystery(4)?',
                    answer: '24'
                },
                {
                    title: '🌳 ARRAY MANIPULATION',
                    challenge: 'Given array [1,2,3,4,5], after these operations:\n1. Remove element at index 2\n2. Add 10 at index 1\n\nWhat is the sum of all elements?',
                    answer: '22'
                }
            ],
            yellow: [
                {
                    title: '🔐 CAESAR CIPHER',
                    challenge: 'Decrypt this Caesar cipher with shift 3:\n"GHIXVH WKH ERPE"\n\nWhat is the original message?',
                    answer: 'defuse the bomb'
                },
                {
                    title: '🔐 BINARY ENCODING',
                    challenge: 'Convert the binary number 1101001 to decimal.',
                    answer: '105'
                },
                {
                    title: '🔐 ASCII CODE',
                    challenge: 'What character has ASCII code 65?',
                    answer: 'a'
                },
                {
                    title: '🔐 HASH FUNCTION',
                    challenge: 'Simple hash function: h(x) = (x * 7) mod 11\nWhat is h(15)?',
                    answer: '6'
                },
                {
                    title: '🔐 XOR CIPHER',
                    challenge: 'In XOR encryption, if plaintext = 42 and key = 17, what is the ciphertext?\n(42 XOR 17 = ?)',
                    answer: '59'
                }
            ],
            purple: [
                {
                    title: '📊 GRAPH THEORY',
                    challenge: 'In a complete graph with 5 vertices, how many edges are there?\n(Complete graph: every vertex connects to every other vertex)',
                    answer: '10'
                },
                {
                    title: '📊 SHORTEST PATH',
                    challenge: 'Graph edges with weights:\nA-B: 4, B-C: 3, A-C: 8, B-D: 2, C-D: 1\n\nShortest path from A to D?',
                    answer: '6'
                },
                {
                    title: '📊 TREE TRAVERSAL',
                    challenge: 'Binary tree in-order traversal:\n      5\n    /   \\\n   3     8\n  / \\   /\n 2   4 7\n\nWhat is the in-order sequence?',
                    answer: '2,3,4,5,7,8'
                },
                {
                    title: '📊 DIJKSTRA ALGORITHM',
                    challenge: 'Using Dijkstra\'s algorithm:\nStart: A\nA→B:2, A→C:4, B→C:1, B→D:7, C→D:3\n\nShortest distance from A to D?',
                    answer: '6'
                },
                {
                    title: '📊 MINIMUM SPANNING TREE',
                    challenge: 'Find the total weight of MST:\nEdges: AB(2), AC(3), AD(4), BC(1), BD(5), CD(6)\n\nWhat is the minimum total weight?',
                    answer: '6'
                }
            ]
        };
    }

    getFallbackChallenge(wireColor) {
        const challenges = this.fallbackChallenges[wireColor];
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        
        // Store solution
        this.solutions[wireColor] = randomChallenge.answer;
        
        return randomChallenge;
    }

    // ================== VALIDATION METHODS ==================
    validateAnswer(wireColor, userAnswer) {
        const correctAnswer = this.solutions[wireColor];
        if (!correctAnswer) return false;
        
        const cleanUserAnswer = userAnswer.toLowerCase().trim();
        const cleanCorrectAnswer = correctAnswer.toLowerCase().trim();
        
        // Handle multiple answer formats
        if (this.isNumeric(cleanUserAnswer) && this.isNumeric(cleanCorrectAnswer)) {
            return parseFloat(cleanUserAnswer) === parseFloat(cleanCorrectAnswer);
        }
        
        // Handle arrays/sequences (comma separated)
        if (cleanUserAnswer.includes(',') || cleanCorrectAnswer.includes(',')) {
            const userArray = cleanUserAnswer.split(',').map(x => x.trim());
            const correctArray = cleanCorrectAnswer.split(',').map(x => x.trim());
            return JSON.stringify(userArray) === JSON.stringify(correctArray);
        }
        
        // Handle special cases
        if (cleanCorrectAnswer === 'empty' && (cleanUserAnswer === 'empty' || cleanUserAnswer === '')) {
            return true;
        }
        
        // Direct string comparison
        return cleanUserAnswer === cleanCorrectAnswer;
    }

    isNumeric(str) {
        return !isNaN(str) && !isNaN(parseFloat(str));
    }

    // ================== CHALLENGE DIFFICULTY SCALING ==================
    getDifficultyMultiplier(difficulty) {
        const multipliers = {
            easy: 0.7,
            medium: 1.0,
            hard: 1.3,
            nightmare: 1.6
        };
        return multipliers[difficulty] || 1.0;
    }

    // Add difficulty-based prompt modifications
    getPromptModifier(difficulty) {
        const modifiers = {
            easy: "Make this challenge easier and more straightforward. Provide more hints.",
            medium: "Make this challenge moderately difficult with clear instructions.",
            hard: "Make this challenge more difficult and require deeper thinking.",
            nightmare: "Make this challenge extremely difficult and complex. Add multiple steps."
        };
        return modifiers[difficulty] || modifiers.medium;
    }

    // ================== CHALLENGE STATISTICS ==================
    getChallengeStats() {
        return {
            totalChallenges: Object.keys(this.solutions).length,
            solvedChallenges: Object.values(this.solutions).filter(s => s !== null).length,
            remainingChallenges: 5 - Object.keys(this.solutions).length
        };
    }

    // Reset all solutions
    reset() {
        this.solutions = {};
        console.log('🔄 All challenges reset');
    }

    // ================== ADVANCED FEATURES ==================
    
    // Generate hint for current challenge
    async generateHint(wireColor) {
        if (!this.apiKey) {
            return "💡 Hint: Think step by step and break down the problem into smaller parts.";
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "Provide a helpful hint for solving this challenge. Don't give away the answer, just guide the thinking process."
                        },
                        {
                            role: "user",
                            content: `Provide a hint for this ${wireColor} wire challenge.`
                        }
                    ],
                    max_tokens: 100,
                    temperature: 0.7
                })
            });

            if (response.ok) {
                const data = await response.json();
                return "💡 " + data.choices[0].message.content;
            }
        } catch (error) {
            console.error('Error generating hint:', error);
        }

        return "💡 Hint: Review the problem carefully and consider what information you have.";
    }

    // Analyze wrong answers and provide feedback
    analyzeWrongAnswer(wireColor, userAnswer) {
        const feedback = [
            "❌ Incorrect. Double-check your calculations.",
            "❌ Not quite right. Review the problem statement.",
            "❌ Wrong answer. Consider a different approach.",
            "❌ Incorrect. Make sure you understand what's being asked.",
            "❌ Try again. Break the problem into smaller steps."
        ];
        
        return feedback[Math.floor(Math.random() * feedback.length)];
    }
}

// Export for use in main script
window.BombChallenges = BombChallenges;
import readline from 'node:readline/promises';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const expenseDB = [];
const incomeDB = [];

const callAgent = async () => {
    const rl = readline.createInterface({
        input: process.stdin,  // Taking input from terminal
        output: process.stdout // Gives output inside terminal only
    });

    const messages = [
        {
            role: "system",
            content: `You are Personal finance Assistant. Your task is to assist users with their expenses, balances, and financial planning.
            You have access to following tools:
            1. getTotalExpense({ from, to }): string // Get total expense for a time period. 
            2. addExpense({ name, amount }): string // Add new expense to the expense database.
            3. addIncome({ name, amount }): string // Add new income to the income database.
            4. getMoneyBalance(): string // Getting remaining balance from database.

            Current DateTime: ${new Date().toUTCString()}`
        },
    ];

    // This is for user prompting in loop
    while (true) {
        const question = await rl.question("USER: ");

        if (question === "Thanks a lot. Bye!") {
            break;
        }

        messages.push({
            role: "user", //Role: User means end-user message
            content: question,
        });

        // This is for agent
        while (true) {
            const completion = await groq.chat.completions.create({
                messages: messages,
                model: "llama-3.3-70b-versatile",
                tools: [
                    {
                        type: 'function',
                        function: {
                            name: 'getTotalExpense',
                            description: "It returns us total expense from between from and to date.",
                            parameters: {
                                type: "object",
                                properties: {
                                    from: {
                                        type: "string",
                                        description: "From date to get the expense."
                                    },
                                    to: {
                                        type: "string",
                                        description: "To date to get the expense."
                                    }
                                }
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'addExpense',
                            description: "It adds new expense entry to the expense database.",
                            parameters: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        description: "Name of the expense. Eg: Bought a washing machine"
                                    },
                                    amount: {
                                        type: "string",
                                        description: "Amount of the expense."
                                    }
                                }
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'addIncome',
                            description: "Add new income entry to income database.",
                            parameters: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        description: "Name of the income. Eg: Got Salary from company"
                                    },
                                    amount: {
                                        type: "string",
                                        description: "Amount of the income."
                                    }
                                }
                            }
                        }
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'getMoneyBalance',
                            description: "Get remaining money balance from database",
                        }
                    },
                ],
            });

            // console.log(JSON.stringify(completion.choices[0], null, 2));
            messages.push(completion.choices[0].message);

            const toolCalls = completion.choices[0].message.tool_calls;

            // If there is no tool calling that means we got the response.
            if (!toolCalls) {
                console.log(`ASSISTANT: ${completion.choices[0].message.content}`);
                break;
            }

            for (let tool of toolCalls) {
                const functionName = tool.function.name;
                const functionArgs = tool.function.arguments;

                let result = "";
                if (functionName === 'getTotalExpense') {
                    result = getTotalExpense(JSON.parse(functionArgs)).toString();
                } else if (functionName === 'addExpense') {
                    result = addExpense(JSON.parse(functionArgs));
                } else if (functionName === 'addIncome') {
                    result = addIncome(JSON.parse(functionArgs));
                } else if (functionName === 'getMoneyBalance') {
                    result = getMoneyBalance(JSON.parse(functionArgs));
                }

                messages.push({
                    role: "tool",
                    content: result,
                    tool_call_id: tool.id
                });

            }

            // console.log("=========================================");
            // console.log("MESSAGES", messages);
            // console.log("=========================================");
            // console.log("DB: ", expenseDB);
        }
    }
    rl.close();
};

callAgent();

/**
 * Get total expense
 */

function getTotalExpense({ from, to }) {
    // console.log("Calling getTotalExpense tool...");

    // In reality, we call DB here...
    const expense = expenseDB.reduce((acc, item) => {
        return acc + item.amount;
    }, 0);

    return `${expense} INR`;
}

function addExpense({ name, amount }) {
    // console.log(`Adding ${amount} to expense DB for ${name}`);
    expenseDB.push({ name, amount });
    
    return "Added to the expense DB.";
}

function addIncome({ name, amount }) {
    incomeDB.push({ name, amount });

    return "Added income to the income DB.";
}

function getMoneyBalance() {
    const totalIncome = incomeDB.reduce((acc, item) => acc + item.amount, 0);
    const totalExpense = expenseDB.reduce((acc, item) => acc + item.amount, 0);

    return `${totalIncome - totalExpense} INR`;
}
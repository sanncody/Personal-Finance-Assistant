import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const expenseDB = [];

const callAgent = async () => {
    const messages = [
        {
            role: "system",
            content: `You are Personal finance Assistant. Your task is to assist users with their expenses, balances, and financial planning.
                current DateTime: ${new Date().toUTCString()}`
        },
    ];

    messages.push({
        role: "user", //Role: User means end-user message
        content: "Hello buddy, I just bought a new washing machine for 30000",
    });

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
                }
            ],
        });

        // console.log(JSON.stringify(completion.choices[0], null, 2));
        messages.push(completion.choices[0].message);

        const toolCalls = completion.choices[0].message.tool_calls;

        // If there is no tool calling that means we got the response.
        if (!toolCalls) {
            console.log(`Assistant: ${completion.choices[0].message.content}`);
            break;
        }

        for (let tool of toolCalls) {
            const functionName = tool.function.name;
            const functionArgs = tool.function.arguments;
            console.log("FunctionName", functionName);
            console.log("FunctionArgs", functionArgs);
            let result = "";
            if (functionName === 'getTotalExpense') {
                result = getTotalExpense(JSON.parse(functionArgs)).toString();
            } else if (functionName === 'addExpense') {
                result = addExpense(JSON.parse(functionArgs));
            }

            messages.push({
                role: "tool",
                content: result,
                tool_call_id: tool.id
            });
            
        }

        console.log("=========================================");
        console.log("MESSAGES", messages);
        console.log("=========================================");
        console.log("DB: ", expenseDB);
    }

};

callAgent();

/**
 * Get total expense
 */

function getTotalExpense({ from, to }) {
    console.log("Calling getTotalExpense tool...");

    // In reality, we call DB here...
    const expense = expenseDB.reduce((acc, item) => {
        return acc + item.amount;
    }, 0);

    return `${expense} INR`;
}

function addExpense({ name, amount }) {
    console.log(`Adding ${amount} to expense DB for ${name}`);
    expenseDB.push({ name, amount });
    
    return "Added to the DB.";
}
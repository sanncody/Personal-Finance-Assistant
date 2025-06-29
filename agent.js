import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

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
        content: "How much money I have spent this month?",
    });

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
            }
        ],
    });

    console.log(JSON.stringify(completion.choices[0], null, 2));
    messages.push(completion.choices[0].message);

    const toolCalls = completion.choices[0].message.tool_calls;

    // If there is no tool calling that means we got the response.
    if (!toolCalls) {
        console.log(`Assistant: ${completion.choices[0].message.content}`);
        return;
    }

    for (let tool of toolCalls) {
        const functionName = tool.function.name;
        const functionArgs = tool.function.arguments;

        let result = "";
        if (functionName === 'getTotalExpense') {
            result = getTotalExpense(JSON.parse(functionArgs)).toString();
        }

        messages.push({
            role: "tool",
            content: result,
            tool_call_id: tool.id
        });
        const completionAgain = await groq.chat.completions.create({
            messages,
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
                }
            ],
        });

        console.log(completionAgain.choices[0]);
    }

    console.log("=========================================");
    console.log("Messages", messages);

};

callAgent();

/**
 * Get total expense
 */

function getTotalExpense({ from, to }) {
    console.log("Calling getTotalExpense tool...");

    // In reality, we call DB here...
    return 20000;
}
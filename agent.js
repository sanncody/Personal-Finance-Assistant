import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const callAgent = async () => {
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are Personal finance Assistant. Your task is to assist users with their expenses, balances, and financial planning."
            },
            {
                role: "user", //Role: User means end-user message
                content: "How much money I have spent this month?",
            },
        ],
        model: "llama-3.3-70b-versatile"
    });

    console.log(completion.choices[0].message);
};

callAgent();
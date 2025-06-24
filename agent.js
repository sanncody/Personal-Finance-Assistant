import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const callAgent = async () => {
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: "hi",
            },
        ],
        model: "llama-3.3-70b-versatile"
    });

    console.log(completion);
};

callAgent();
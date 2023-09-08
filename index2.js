const { createBot } = require('whatsapp-cloud-api');
// const openai = require('openai');
const mysql = require('mysql2');
const funcs = require('./functions.js');
const fs = require('fs');
const { OpenAI } = require("openai");
const { response } = require('express');
require("dotenv").config();




let completionResponse;
let functionCallName;
let user_text;



(async () => {
    try {
        // replace the values below from the values you copied above
        const from = process.env.from;
        const token = process.env.token;
        const to = process.env.sender; // your phone number without the leading '+'
        const webhookVerifyToken = process.env.webhookVerifyToken; // use a random value, e.g. 'bju#hfre@iu!e87328eiekjnfw'

        const bot = createBot(from, token);

        const result = await bot.sendText(to, 'Hi Demo Bot here! How can I help you?');

        // Start an express server to listen for incoming messages
        await bot.startExpressServer({
            webhookVerifyToken,
        });

        // Initialize OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Function to handle message completions
        async function runCompletion(messages) {
            user_text = JSON.stringify(messages);
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo-0613",
                messages: [
                    {
                        role: 'system',
                        content: `You are a financial advisor and salesperson named Demo Bot. Your expertise is in providing personalized financial guidance. Your goal is to assist users with investment decisions, savings, retirement planning, and financial security. Respond politely in Arabic without repeating questions.and when sales_manager function called give answer according to your previous knowledge`
                    },
                    {
                        role: 'user',
                        // content: "hello. I want to buy iphone 12"
                        content: `"${user_text}"`
                    }
                ],
                functions: [
                    {
                        name: "financial_advisor_quest_ans",
                        description: "Tell all the answers of questions related to finance and give them very decisive decision suggestion that what will be the best",
                        parameters: {
                            type: "object",
                            properties: {
                                question: {
                                    type: "string",
                                    description: "The question related to finance"
                                }
                            },
                            required: ["question"],
                        }
                    },
                    {
                        name: "sales_manager",
                        description: "works as a sales manager and tell about the products in market their prices, specifications and compare them that which product is best in specific price range and compare the products quality",
                        parameters: {
                            type: "object",
                            properties: {
                                question: {
                                    type: "string",
                                    description: "The question related to products and goods"
                                }
                            },
                            required: ["question"]
                        }
                    }

                ],
                max_tokens: 150,
                function_call: "auto"
            });
            console.log("completion.choices[0]=  ", completion.choices[0]);
            completionResponse = completion.choices[0].message.content;
            console.log("completionResponse  ", completionResponse);
            // // console.log(completion.data);
            // console.log("Completion Response, Completion Response.content:  ", completionResponse, completionResponse.content);

            if (!completionResponse) {
                functionCallName = completion.choices[0].message.function_call.name;
                const functionArguments = JSON.parse(completion.choices[0].message.function_call.arguments);
                console.log("FunctionCallName:   ", functionCallName);
                console.log("FunctionArguments:   ", functionArguments);
            }
            if (functionCallName === "sales_manager") {
                // const completionArguments = JSON.parse(completion.choices[0].message.function_call.arguments);
                // console.log("completionArguments, CompletionArguments.question:  ", completionArguments, completionArguments.question);
                // sales_manager(completionArguments.question);

                const completionArguments = JSON.parse(completion.choices[0].message.function_call.arguments);
                console.log("completionArguments, CompletionArguments.question:  ", completionArguments, completionArguments.question);

                // Call the sales_manager function and get its response
                const salesManagerResponse = sales_manager(completionArguments.question);

                // Handle the sales_manager response and assign it to completionResponse
                completionResponse = salesManagerResponse.join('\n'); // Convert the array to a string
            }



        }
        // await runCompletion(user_text);

        // console.log("---->", botResponse)

        // console.log("RUN COMPLETION FUNCTION:    ", runCompletion(completionResponse));
        // }
        //     catch (error) {
        //         console.log(error);
        //     }
        // });

        // Handle incoming messages
        const input = completionResponse;
        console.log("input =  ", input);
        console.log("user_text =  ", user_text);
        // const input = JSON.stringify(completionResponse);
        bot.on('message', async (user_text) => {
            try {
                const userMessage = user_text.data.text;
                console.log("USER MESSAGE:    ", userMessage)
                // const botResponse = await runCompletion(completionResponse);
                await runCompletion(user_text);
                const botResponse = completionResponse;
                console.log("BOT RESPONSE: ", botResponse);
                // await bot.sendText(input.from, botResponse);
                await bot.sendText(user_text.from, botResponse);

                // Save the conversation to the database
                const pool = mysql.createPool({
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    database: process.env.DB_DATABASE,
                    password: process.env.DB_PASSWORD,
                });

                pool.query(
                    'INSERT INTO new_table (sender, message, bot_response) VALUES (?, ?, ?)',
                    [user_text.from, userMessage, botResponse],
                    (err, results) => {
                        if (err) {
                            console.error('Error saving conversation:', err);
                        } else {
                            console.log('Conversation saved to database.');
                        }
                    }
                );

                // Check if the message matches a function
                // for (const func of funcs) {
                //     if (func.name === userMessage) {
                //         // Call the function
                //         const result = await func.call(openai, messageContent);
                //         await bot.sendText(messages.from, result);
                //     }
                // }
            } catch (err) {
                console.error("Error in message handler:", err);
            }
        });
    } catch (err) {
        console.log(err);
    }
})();






//FUNCTIONS HEADERS

function sales_manager(user_text) {
    let quest = user_text;
    let answer = [];
    if (quest.includes("Hello") || quest.includes("hi") || quest.includes("Assalam o alaikum") || quest.includes("اسلام علیکم")) {
        answer.push("answer the greetings in arabic");
    }


    if (quest.includes("compare") || quest.includes("compare _ and _") || quest.includes("Can you compare Product A and Product B for me? I want to know the specifications and differences")) {
        answer.push("Compare the products and tell them all the specifications of both products and also tell them the price of both of the products");
        answer.push(`' NETWORK: 5G, IP68 resistant. DISPLAY: Super Retina XDR OLED, 6.7", 1284x2778, Ceramic Shield. CAMERA: Dual 12MP wide, 12MP ultrawide. BATTERY: Li-Ion 4323mAh. PRICE: From $899. "
        '# iPhone 14: specifications & cost'
         ' NETWORK: 5G, IP68 resistant. DISPLAY: Super Retina XDR OLED, 6.1", 1170x2532, Ceramic Shield. CAMERA: Dual 12MP wide, 12MP ultrawide. BATTERY: Li-Ion 3279mAh. PRICE: From $799. "
        '# iPhone 14 Pro: details & price'
        ' NETWORK: 5G, IP68 resistant. DISPLAY: LTPO Super Retina XDR OLED, 6.1", 1179x2556, Ceramic Shield, 120Hz. CAMERA: Triple 48MP wide, 12MP telephoto, 12MP ultrawide. BATTERY: Li-Ion 3200mAh. PRICE: From $999. "
        '# iPhone 14 Pro Max: specs & cost '
         ' NETWORK: 5G, IP68 resistant. DISPLAY: LTPO Super Retina XDR OLED, 6.7", 1290x2796, Ceramic Shield, 120Hz. CAMERA: Triple 48MP wide, 12MP telephoto, 12MP ultrawide. BATTERY: Li-Ion 4323mAh. PRICE: From $1099. '   
        "`)
    }

    if (quest.includes("better" || "Which product is better")) {
        answer.push("If a user ask about the product that which is better product between the two then just use your knowledge and go through to all specification of both products and then tell him which product has more and effecient specification and then tell him the price of both of the products.");
    }

    if (quest.includes("difference") || quest.includes("differences between") || quest.includes("prices") || quest.includes("specification") || quest.includes("better")) {
        answer.push(`iPhone 11:
Price: [Insert Price of iPhone 11]
Display: [Insert Display Details of iPhone 11]
Camera: [Insert Camera Specifications of iPhone 11]
Processor: [Insert Processor Details of iPhone 11]
Battery Life: [Insert Battery Life Details of iPhone 11]
Additional Features: [Insert Notable Features of iPhone 11]
iPhone 12:
Price: [Insert Price of iPhone 12]
Display: [Insert Display Details of iPhone 12]
Camera: [Insert Camera Specifications of iPhone 12]
Processor: [Insert Processor Details of iPhone 12]
Battery Life: [Insert Battery Life Details of iPhone 12]
Additional Features: [Insert Notable Features of iPhone 12]
Recommendation:
Based on the specifications and features, the iPhone 12 offers advancements in terms of its camera technology, display quality,     and processor. While the iPhone 11 remains a solid choice, the iPhone 12's enhanced capabilities make it the better option for     users seeking the latest advancements in smartphone technology.`)
    }

    return answer;


}


function financial_advisor_quest_ans(question) {
    let suggestions = ` "# I'm concerned about my retirement savings. What strategies do you recommend?"
    -"Planning for retirement is essential. Let's review your current financial situation and explore options like 401(k)s, IRAs, and other investment vehicles to secure a comfortable retirement."
    "# I've recently received a windfall. How should I manage and invest this unexpected sum?"
    -"Windfalls can provide great opportunities. Let's discuss your financial goals, risk tolerance, and time horizon to create a diversified investment plan that aligns with your aspirations"        
    "# I'm considering buying a house. What financial steps should I take before making this big decision?"
    -"Buying a home is a significant step. Let's analyze your current finances, credit score, and affordability to ensure you're well-prepared. We'll explore mortgage options and budgeting strategies."       
    "# what's the best way to save for my child's education?"
    -"Education savings are crucial. We can explore 529 plans, Coverdell ESAs, and other options to help you achieve your goal of providing quality education for your child."       
    "# I'm worried about market volatility. How can I protect my investments during uncertain times?"
    -"Market volatility is normal. Let's review your investment portfolio, assess risk tolerance, and consider diversification to mitigate potential losses and achieve long-term goals."      
    "# I'm interested in socially responsible investing. Can you guide me on how to align my investments with my values?"
    -"Socially responsible investing is a great choice. We'll identify companies aligned with your values and explore ESG funds, impact investments, and sustainable strategies."  
    "# I'm self-employed. What retirement options are available for someone like me?"
    -"Being self-employed offers unique retirement challenges. We'll explore options like a Solo 401(k), SEP-IRA, or SIMPLE IRA to help you build a secure retirement fund."  
    "# I'm thinking about life insurance. How can I determine the coverage I need for my family's financial security?"
    -"Life insurance is crucial for protecting loved ones. Let's assess your family's financial needs, consider factors like income replacement and debts, and find the right coverage." 
    "# what's the best way to start investing with a limited budget?"
    -"Starting small is a great approach. We'll discuss micro-investing, fractional shares, and low-cost ETFs to help you build a diversified investment portfolio over time."  
    "# how can I prioritize paying off debt while still saving for the future?"
    -"Balancing debt repayment and saving is important. We'll create a financial plan that allocates funds strategically, addressing high-interest debts while securing your financial future."
    "You are a financial advisor named Demo Bot. Your expertise lies in providing personalized financial guidance to individuals. Your goal is to assist them in making informed decisions about investments, savings, retirement planning, and financial security.
    Prompt Examples:
    '# I'm concerned about my retirement savings. What strategies do you recommend?'
    - 'Planning for retirement is essential. Let's review your current financial situation and explore options like 401(k)s, IRAs, and other investment vehicles to secure a comfortable retirement.'
    '# I've recently received a windfall. How should I manage and invest this unexpected sum?'
    - 'Windfalls can provide great opportunities. Let's discuss your financial goals, risk tolerance, and time horizon to create a diversified investment plan that aligns with your aspirations.'
    '# I'm considering buying a house. What financial steps should I take before making this big decision?'
    - 'Buying a home is a significant step. Let's analyze your current finances, credit score, and affordability to ensure you're well-prepared. We'll explore mortgage options and budgeting strategies.'
    '# what's the best way to save for my child's education?'
    - 'Education savings are crucial. We can explore 529 plans, Coverdell ESAs, and other options to help you achieve your goal of providing quality education for your child.'
    '# I'm worried about market volatility. How can I protect my investments during uncertain times?'
    - 'Market volatility is normal. Let's review your investment portfolio, assess risk tolerance, and consider diversification to mitigate potential losses and achieve long-term goals.'
    '# I'm interested in socially responsible investing. Can you guide me on how to align my investments with my values?'
    - 'Socially responsible investing is a great choice. We'll identify companies aligned with your values and explore ESG funds, impact investments, and sustainable strategies.'
    '# I'm self-employed. What retirement options are available for someone like me?'
    - 'Being self-employed offers unique retirement challenges. We'll explore options like a Solo 401(k), SEP-IRA, or SIMPLE IRA to help you build a secure retirement fund.'
    '# I'm thinking about life insurance. How can I determine the coverage I need for my family's financial security?'
    - 'Life insurance is crucial for protecting loved ones. Let's assess your family's financial needs, consider factors like income replacement and debts, and find the right coverage.'
    '# what's the best way to start investing with a limited budget?'
    - 'Starting small is a great approach. We'll discuss micro-investing, fractional shares, and low-cost ETFs to help you build a diversified investment portfolio over time.'
    '# how can I prioritize paying off debt while still saving for the future?'
    - 'Balancing debt repayment and saving is important. We'll create a financial plan that allocates funds strategically, addressing high-interest debts while securing your financial future.'" `;
    // response();
    return suggestions;
}
const { createBot } = require('whatsapp-cloud-api');
// const openai = require('openai');
const mysql = require('mysql2');
const fs = require('fs');
const { OpenAI } = require("openai");
const { response } = require('express');
require("dotenv").config();
// const fs = require("fs");
const filepath = './product.json'
const message_command = './command.js'


let completionResponse;
let functionCallName;
let user_text;
let salesManagerResponse;
let PRICE;

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
                        content: `You are sales manager and financial advisor and your name is Alexendar. you will provide the all information the user ask and tell them with all of the queries according to your knowledge`
                    },
                    {
                        role: 'user',
                        // content: "hello. I want to buy iphone 12"
                        content: `"${user_text}"`
                    }
                ],
                functions: [
                    //     {
                    //         name: "financial_advisor_quest_ans",
                    //         description: "Tell all the answers of questions related to finance and give them very decisive decision suggestion that what will be the best",
                    //         parameters: {
                    //             type: "object",
                    //             properties: {
                    //                 model: {
                    //                     type: "string",
                    //                     description: "model name and number of an electronic device"
                    //                 }
                    //             },
                    //             required: ["model"],

                    //             model2: {
                    //                 type: "string",
                    //                 description: "model name and number of an electronic device"
                    //             }
                    //         },
                    //         required: ["model2"],

                    //     },
                    {
                        name: "sales_manager",
                        // name: "findPhoneByModel",
                        description: "tell the specifications of electronic device",
                        parameters: {
                            type: "object",
                            properties: {
                                model: {
                                    type: "string",
                                    description: "Model name eg. Apple iphone 12"
                                }
                            },
                            required: ["model"]
                        }
                    },
                    {
                        name: "price",
                        // name: "findPhoneByModel",
                        description: "tell the prices of electronic devices",
                        parameters: {
                            type: "object",
                            properties: {
                                model: {
                                    type: "string",
                                    description: "Model name eg. Apple iphone 12"
                                }
                            },
                            required: ["model"]
                        }
                    },
                    {
                        name: "general_prompt",
                        description: "Answer the general queries according to openai knowledge and greet them and talk like human",
                        parameters: {
                            type: "object",
                            properties: {
                                input: {
                                    type: "string",
                                    description: "any question or query eg. Compare iphone 12 and iphone 13?  , which is the better phone?"
                                }
                            },
                            required: ["input"]
                        }
                    }

                ],
                max_tokens: 500,
                function_call: "auto"
            });
            console.log("completion.choices[0]=  ", completion.choices[0]);
            completionResponse = completion.choices[0].message.content;
            console.log("completionResponse  ", completionResponse);

            if (!completionResponse) {
                functionCallName = completion.choices[0].message.function_call.name;
                const functionArguments = JSON.parse(completion.choices[0].message.function_call.arguments);
                console.log("FunctionCallName:   ", functionCallName);
                console.log("FunctionArguments:   ", functionArguments);
            }
            if (functionCallName === "sales_manager") {

                const completionArguments = JSON.parse(completion.choices[0].message.function_call.arguments);
                console.log("completionArguments, CompletionArguments.model:  ", completionArguments, completionArguments.model);

                // Call the sales_manager function and get its response
                try {
                    salesManagerResponse = await sales_manager(completionArguments.model);
                    console.log("Sales manager response: ", salesManagerResponse);

                    // Handle the sales_manager response and assign it to completionResponse
                    completionResponse = salesManagerResponse;
                    console.log("COMPLETION RESPONSE Inside the function: ", completionResponse);
                } catch (error) {
                    console.error("Error in sales_manager:", error);
                }


                console.log("Sales manager response: ", salesManagerResponse);
                // Handle the sales_manager response and assign it to completionResponse
                completionResponse = salesManagerResponse; // Convert the array to a string
                // completionResponse = JSON.stringify(salesManagerResponse.price);
                console.log("COMPLETION RESPONSE Inside the function: ", completionResponse)
            }
            else if (functionCallName === "price") {

                const completionArguments = JSON.parse(completion.choices[0].message.function_call.arguments);
                console.log("completionArguments, CompletionArguments.model:  ", completionArguments, completionArguments.model);

                // Call the sales_manager function and get its response
                try {
                    PRICE = await price(completionArguments.model);
                    console.log("Price: ", PRICE);

                    // Handle the sales_manager response and assign it to completionResponse
                    completionResponse = PRICE;
                    console.log("COMPLETION RESPONSE Inside the function: ", completionResponse);
                } catch (error) {
                    console.error("Error in sales_manager:", error);
                }


                console.log("Sales manager response: ", PRICE);
                // Handle the sales_manager response and assign it to completionResponse
                completionResponse = PRICE; // Convert the array to a string
                // completionResponse = JSON.stringify(salesManagerResponse.price);
                console.log("COMPLETION RESPONSE Inside the function: ", completionResponse)
            }
            else if (functionCallName === "general_prompt") {

                const completionArguments = JSON.parse(completion.choices[0].message.function_call.arguments);
                console.log("completionArguments:  ", completionArguments,);

                // Call the sales_manager function and get its response
                try {
                    gen_prompt = await general_prompt(completionArguments);
                    console.log("gen_prompt: ", gen_prompt);

                    // Handle the sales_manager response and assign it to completionResponse
                    completionResponse = gen_prompt;
                    console.log("COMPLETION RESPONSE Inside the function: ", completionResponse);
                } catch (error) {
                    console.error("Error in gen_prompt:", error);
                }


                console.log("general prompt 2: ", gen_prompt);
                // Handle the sales_manager response and assign it to completionResponse
                completionResponse = gen_prompt; // Convert the array to a string
                // completionResponse = JSON.stringify(salesManagerResponse.price);
                console.log("COMPLETION RESPONSE Inside the function: ", completionResponse)
            }



        }

        // Handle incoming messages
        const input = completionResponse;
        // console.log("input =  ", input);
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
            } catch (err) {
                console.error("Error in message handler:", err);
            }
        });
    } catch (err) {
        console.log(err);
    }
})();






//FUNCTIONS HEADERS

// async function sales_manager(model) {
//     let ans = [];
//     console.log("model argument in function is : ", model);

//     const data = await fs.promises.readFile(filepath, 'utf8');
//     try {
//         const jsonData = JSON.parse(data);
//         const foundPhone = jsonData.find(phone => phone.model.toLowerCase() === model.toLowerCase().includes(phone.model.toLowerCase()));
//         if (foundPhone) {
//             let string = ("Model " + foundPhone.model + "\nPrice" + foundPhone.price + "\nSpecifications\n" + "Ratings: " + foundPhone.rating + "\n" + foundPhone.sim + "\n" + foundPhone.precessor + "\n" + foundPhone.battery + "\n" + foundPhone.display + "\n" + foundPhone.camera + "\n" + foundPhone.card + "\n" + foundPhone.os);
//             console.log("DESCRIPTION:" + string);
//             completionResponse = string;
//             console.log("----> " + string)
//             return string;
//         } else {
//             return console.log('Phone model not found.');
//         }
//     }
//     catch (parseError) {
//         console.error('Error parsing JSON:', parseError);
//     }
// };


async function sales_manager(model) {
    const data = await fs.promises.readFile(filepath, 'utf8');

    try {
        const jsonData = JSON.parse(data);
        const matchingPhones = [];

        jsonData.forEach(phoneData => {
            const modelLowerCase = phoneData.model.toLowerCase();
            const queryLowerCase = model.toLowerCase();

            if (modelLowerCase.includes(queryLowerCase)) {
                matchingPhones.push(phoneData);
            }
        });

        if (matchingPhones.length > 0) {
            matchingPhones.forEach(matchingPhone => {
                let string = ("\nModel " + matchingPhone.model + "\nPrice" + matchingPhone.price + "\nSpecifications\n" + "Ratings: " + matchingPhone.rating + "\n" + matchingPhone.sim + "\n" + matchingPhone.precessor + "\n" + matchingPhone.battery + "\n" + matchingPhone.display + "\n" + matchingPhone.camera + "\n" + matchingPhone.card + "\n" + matchingPhone.os);
                // console.log("DESCRIPTION:" + string);
                return console.log("String return: " + string);
            });
        } else {
            console.log('No matching phones found.');
        }
    } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
    }

}
async function price(model) {
    const data = await fs.promises.readFile(filepath, 'utf8');
    jsonData = JSON.parse(data);
    try {
        const foundPhone = jsonData.find(phone => phone.model.toLowerCase() === model.toLowerCase());
        if (foundPhone) {
            let price = foundPhone.price;
            console.log("before parsing: " + price);
            price = price.replace(/,/g, '');
            price = price.replace(/₹/g, '');
            console.log("after parsing: " + price);
            price = parseFloat(price);
            if (isNaN(price)) {
                console.error("Invalid price value:", foundPhone.price);
                return;
            }
            // Perform the calculation and return the result
            const calculatedPrice = price * 0.045;
            console.log("Calculated price:", calculatedPrice);
            return calculatedPrice
        }
        else {
            return console.log('Phone model not found.');
        }
    }
    catch (parseError) {
        console.error('Error parsing JSON:', parseError);
    }
}


//General prompt

//General prompt


async function general_prompt(input) {
    let response;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // Function to handle message completions
    async function runCompletion(input) {
        console.log("response:  " + "response")
        user_text = JSON.stringify(input);
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0613",
            messages: [{
                role: 'system', content: `You are a financial advisor and also a sales man named Demo Bot. Your expertise lies in providing personalized financial guidance to individuals. Your goal is to assist them in making informed decisions about investments, savings, retirement planning, and financial security. you also solve every products so if anyone ask for product or its price you will check your data from internet or in your server and then tell them the price of those products and if they ask to tell them the difference then you will compare the products Respond all answers in English but don't repeat questions "
                "# I'm concerned about my retirement savings. What strategies do you recommend?"
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
                - 'Balancing debt repayment and saving is important. We'll create a financial plan that allocates funds strategically, addressing high-interest debts while securing your financial future.'"
                '# Can you compare Product A and Product B for me? I want to know the specifications and differences.'
                - 'Of course! I'd be happy to help. Let's start by comparing the specifications of Product A and Product B. I'll provide you with a detailed overview of each product, including features, performance metrics, dimensions, compatibility, and more. This will help you understand their differences and make an informed choice based on your specific needs.'"
                '# Whichproduct is better product A or product B. '
                - 'If a user ask about the product that which is better product between the two then just use your knowledge and go through to all specification of both products and then tell him which product has more and effecient specification and then tell him the price of both of the products. "
                '# Can you please help me understand the differences between the iPhone 11 and iPhone 12? I'm interested in their prices, specifications, and which one is better.'
                - 'iPhone 11:
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
                Based on the specifications and features, the iPhone 12 offers advancements in terms of its camera technology, display quality,     and processor. While the iPhone 11 remains a solid choice, the iPhone 12's enhanced capabilities make it the better option for     users seeking the latest advancements in smartphone technology. "
                '# Compare iPhone 14 Plus: specs & price. '
                - ' NETWORK: 5G, IP68 resistant. DISPLAY: Super Retina XDR OLED, 6.7", 1284x2778, Ceramic Shield. CAMERA: Dual 12MP wide, 12MP ultrawide. BATTERY: Li-Ion 4323mAh. PRICE: From $899. "
                '# iPhone 14: specifications & cost'
                - ' NETWORK: 5G, IP68 resistant. DISPLAY: Super Retina XDR OLED, 6.1", 1170x2532, Ceramic Shield. CAMERA: Dual 12MP wide, 12MP ultrawide. BATTERY: Li-Ion 3279mAh. PRICE: From $799. "
                '# iPhone 14 Pro: details & price'
                - ' NETWORK: 5G, IP68 resistant. DISPLAY: LTPO Super Retina XDR OLED, 6.1", 1179x2556, Ceramic Shield, 120Hz. CAMERA: Triple 48MP wide, 12MP telephoto, 12MP ultrawide. BATTERY: Li-Ion 3200mAh. PRICE: From $999. "
                '# iPhone 14 Pro Max: specs & cost '
                - ' NETWORK: 5G, IP68 resistant. DISPLAY: LTPO Super Retina XDR OLED, 6.7", 1290x2796, Ceramic Shield, 120Hz. CAMERA: Triple 48MP wide, 12MP telephoto, 12MP ultrawide. BATTERY: Li-Ion 4323mAh. PRICE: From $1099. ' `
            }],
            // messages: [{ role: 'user', content: command }],
            max_tokens: 200,

        });
        response = completion.choices[0].message.content;
        console.log("response2:  " + response)
        // return response;
    }

    let funcrun = await runCompletion(input);

    return response;

    // Should I invest in buying home or not?
}
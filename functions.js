
module.exports = {
    func:
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
        description: "tell the specifications, prices and compare electronic devices",
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
    }



};
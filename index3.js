const fs = require("fs");

const filepath = './product.json'
// let jsonData = "./product.json";
let phone = " iphone 12";
// function findPhoneByModel(model) {
//     fs.readFile(filepath, 'utf8', (err, data) => {
//         if (err) {
//             console.log("Error during reading the file")
//         }

//         try {
//             const jsonData = JSON.parse(data);

//             const foundPhone = jsonData.find(function (phone) {
//                 return phone.model.toLowerCase() === model.toLowerCase().includes(phone.model.toLowerCase());
//             });

//             if (foundPhone) {
//                 let string = ("\nModel " + foundPhone.model + "\nPrice" + foundPhone.price + "\nSpecifications\n" + "Ratings: " + foundPhone.rating + "\n" + foundPhone.sim + "\n" + foundPhone.precessor + "\n" + foundPhone.battery + "\n" + foundPhone.display + "\n" + foundPhone.camera + "\n" + foundPhone.card + "\n" + foundPhone.os);
//                 console.log("DESCRIPTION:" + string);
//                 return string;
//             } else {
//                 return console.log('Phone model not found.');
//             }
//         }
//         catch (parseError) {
//             console.error('Error parsing JSON:', parseError);
//         }
//     });
// }

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
                console.log("DESCRIPTION:" + string);
            });
        } else {
            console.log('No matching phones found.');
        }
    } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
    }

}

sales_manager(phone);



// const fs = require("fs");

// const filepath = './product.json';

// function findPhoneByModel(queryModel) {
//     fs.readFile(filepath, 'utf8', (err, data) => {
//         if (err) {
//             console.error("Error during reading the file:", err);
//             return;
//         }

//         try {
//             const jsonData = JSON.parse(data);
//             const matchingPhones = [];

//             jsonData.forEach(phone => {
//                 const modelLowerCase = phone.model.toLowerCase();
//                 const queryLowerCase = queryModel.toLowerCase();
//                 let matchCount = 0;

//                 for (let i = 0; i < modelLowerCase.length; i++) {
//                     if (queryLowerCase.includes(modelLowerCase[i])) {
//                         matchCount++;
//                     }
//                 }

//                 if (matchCount > 0) {
//                     matchingPhones.push({ phone, matchCount });
//                 }
//             });

//             matchingPhones.sort((a, b) => b.matchCount - a.matchCount);

//             if (matchingPhones.length > 0) {
//                 matchingPhones.forEach(matchingPhone => {
//                     console.log('Model:', matchingPhone.phone.model);
//                     console.log('Price:', matchingPhone.phone.price);
//                     console.log('Specifications:');
//                     console.log(matchingPhone.phone);
//                     console.log('Match Count:', matchingPhone.matchCount);
//                     console.log('------------------');
//                 });
//             } else {
//                 console.log('No matching phones found.');
//             }
//         } catch (parseError) {
//             console.error('Error parsing JSON:', parseError);
//         }
//     });
// }

// const searchQuery = 'iphone 12'; // Replace with your search query
// findPhoneByModel(searchQuery);

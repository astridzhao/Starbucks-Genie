// module.exports = {
//     module: {
//         rules: [
//             {
//                 test: /\.mjs$/,
//                 include: /node_modules/,
//                 type: "javascript/auto"
//             },
//             {
//                 test: /\.(js|jsx)$/,
//                 exclude: /node_modules/,
//                 use: {
//                     loader: 'babel-loader',
//                     options: {
//                         presets: ['@babel/preset-env', '@babel/preset-react'],
//                         plugins: ['@babel/plugin-proposal-optional-chaining']
//                     }
//                 }
//             }
//         ]
//     }
// }
module.exports = {
    module: {
        rules: [
            {
                test: /\.(js|mjs|jsx)$/,
                exclude: /node_modules/, // Consider adjusting this if transpiling of node_modules is required
                use: {
                    loader: 'babel-loader',
                    // options: {
                    //     presets: ['@babel/preset-env'],
                    //     plugins: [
                    //         // "@babel/plugin-proposal-nullish-coalescing-operator" // Only add if specifically needed
                    //     ]
                    // }
                }
            }
        ]
    }
};

const canvas = document.getElementById('drinkCanvas');
const ctx = canvas.getContext('2d');
let currentHeight = canvas.height;

// Function to animate pouring effect
function pourIngredient(color, amount, type = 'liquid') {
    let startY = currentHeight - amount;
    const pourSpeed = 20; // Milliseconds between each "pour" increment

    function pour() {
        if (startY < currentHeight) {
            let gradient = ctx.createLinearGradient(0, startY, 0, startY + 5);
            gradient.addColorStop(0, 'rgba(255,255,255,0)');
            gradient.addColorStop(1, color);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, startY, canvas.width, 5);
            startY += 5;
            setTimeout(pour, pourSpeed); // Use setTimeout to control the speed
        } else {
            currentHeight = startY;
            if (type === 'foam') {
                addFoamEffect(color, amount);
            }
        }
    }

    pour(); // Initiate the pouring process
}

// Function to add foam effects with a gradient to simulate frothiness
function addFoamEffect(color, amount) {
    let foamGradient = ctx.createLinearGradient(0, currentHeight, 0, currentHeight + amount);
    foamGradient.addColorStop(0, adjustColorLightness(color, 20));
    foamGradient.addColorStop(1, 'rgba(255,255,255,0.8)');

    ctx.fillStyle = foamGradient;
    ctx.fillRect(0, currentHeight, canvas.width, amount);
    currentHeight += amount; // Update currentHeight after adding foam
}

// Adjust the color lightness
function adjustColorLightness(color, percent) {
    let r = parseInt(color.slice(1, 3), 16),
        g = parseInt(color.slice(3, 5), 16),
        b = parseInt(color.slice(5, 7), 16);

    r = parseInt(r * (100 + percent) / 100);
    g = parseInt(g * (100 + percent) / 100);
    b = parseInt(b * (100 + percent) / 100);

    r = (r < 255) ? r : 255;
    g = (g < 255) ? g : 255;
    b = (b < 255) ? b : 255;

    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

// Add event listeners for the pouring effects
document.getElementById('addBase').addEventListener('click', function () {
    pourIngredient('#6f4e37', 150, 'liquid');
});

document.getElementById('addMilk').addEventListener('click', function () {
    pourIngredient('#fff8dc', 100, 'liquid');
});

document.getElementById('addFoam').addEventListener('click', function () {
    pourIngredient('#f5f5f5', 50, 'foam');
});

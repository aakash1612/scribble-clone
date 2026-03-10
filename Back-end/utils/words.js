const words = [
  "apple", "banana", "car", "dog", "elephant", "house", "mountain", "river",
  "tree", "phone", "computer", "pizza", "burger", "sun", "moon", "star",
  "flower", "butterfly", "guitar", "camera", "rocket", "train", "bicycle",
  "airplane", "castle", "dragon", "robot", "football", "basketball", "helmet",
  "pencil", "book", "school", "teacher", "doctor", "nurse", "hospital",
  "beach", "island", "desert", "keyboard", "volcano", "pyramid", "spider"
];

function getRandomWords(count = 3) {
  // Fisher-Yates Shuffle for better randomness
  const result = [];
  const tempWords = [...words];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * tempWords.length);
    result.push(tempWords[randomIndex]);
    tempWords.splice(randomIndex, 1); // Avoid picking same word twice
  }
  
  return result;
}

module.exports = { getRandomWords };
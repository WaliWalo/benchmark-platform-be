const { writeJSON, readJSON, readdir } = require("fs-extra");
const { join } = require("path");

const questionsFilePath = join(__dirname, "./questions.json");
const examsFilePath = join(__dirname, "../services/exam/exams.json");
const readDB = async (filePath) => {
  try {
    const fileJSON = await readJSON(filePath);
    return fileJSON;
  } catch (error) {
    throw new Error(error);
  }
};

const writeDB = async (filePath, data) => {
  //writing on disk
  try {
    await writeJSON(filePath, data);
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getQuestions: async () => readDB(questionsFilePath),
  writeQuestions: async (media) => writeDB(questionsFilePath, media),
  getExams: async () => readDB(examsFilePath),
  writeExams: async (media) => writeDB(examsFilePath, media),
};

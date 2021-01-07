const { writeJSON, readJSON, readdir } = require("fs-extra");
const { join } = require("path");

const questionsFilePath = join(
  __dirname,
  "../services/questions/questions.json"
);
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
  writeQuestions: async (question) => writeDB(questionsFilePath, question),
  getExams: async () => readDB(examsFilePath),
  writeExams: async (exam) => writeDB(examsFilePath, exam),
};

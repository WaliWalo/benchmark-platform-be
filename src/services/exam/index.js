const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { getQuestions, getExams, writeExams } = require("../../lib/utilities");

const validateExamInput = (dataToValidate) => {
  const schema = Joi.object().keys({
    candidateName: Joi.string().min(3).max(30).required(),
    name: Joi.string().min(3).required(),
  });

  console.log(schema.validate(dataToValidate));
  return schema.validate(dataToValidate);
};
// Generate a new Exam with 5 randomly picked questions in it. The questions can be read from the questions.json file provided.
//Returns: Full exam object, including questions and answers.
//The response contains the exam id and does not contain any clue about the correct answer
// {
//     "_id":"5fd0de8f2bf2321fe8743f1f", // server generated
//     "candidateName": "Tobia",
//     "examDate": "2021-01-07T10:00:00.000+00:00", // server generated
//     "isCompleted":false, // false on creation
//     "name":"Admission Test",
//     "totalDuration": 30, // used only in extras
//     "questions":[ // randomly picked from questions.json
//         {
//         "providedAnswer": 0, // added when the user provides an answer (not on creation)
//         "duration":60,
//         "text":"This is the text of the first question",
//         "answers":[
//             {
//             "text":"Text for the first answer",
//             "isCorrect":false
//             },
//             {
//             "text":"Text for the second answer",
//             "isCorrect":true
//             },{
//             "text":"Text for the third answer",
//             "isCorrect":false
//             },{
//             "text":"Text for the fourth answer",
//             "isCorrect":false
//             }]
//         }
//       ]
//     }
router.post("/exam/start", async (req, res, next) => {
  try {
    const { error } = validateExamInput(req.body);
    if (error) {
      let err = new Error();
      err.message = error.details[0].message;
      err.httpStatusCode = 400;
      next(err);
    } else {
      const questions = await getQuestions();
      const questionsIndex = [];
      for (let i = 0; i < 5; i++) {
        questionsIndex.push(Math.random(0, questions.length));
      }
      console.log(questions);
      res.status(200).send(questions);
    }
  } catch (error) {
    next(error);
  }
});

// Answer to a question for the given exam {id}.
//Body:
// {
//     question: 0, // index of the question
//     answer: 1, // index of the answer
// } // in this case, the answer for the first question is the second choice
// When the answer is provided, the result is kept into the exam and the score is updated accordingly.
// It should not be possible to answer the same question twice.
router.post("/exam/{id}/answer", async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
});

//> GET /exams/{id}
// Returns the information about the exam, including the current score.
router.get("/exam/{id}", async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
});

module.exports = router;

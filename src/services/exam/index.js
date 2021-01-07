const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { getQuestions, getExams, writeExams } = require("../../lib/utilities");
const uniqid = require("uniqid");
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
    //validate candidateName and name
    const { error } = validateExamInput(req.body);
    if (error) {
      let err = new Error();
      err.message = error.details[0].message;
      err.httpStatusCode = 400;
      next(err);
    } else {
      //allow user to input the number of questions
      let noQues = 5;
      if (req.query.noQues) {
        noQues = req.query.noQues;
      }
      //get all questions
      const questions = await getQuestions();
      //shuffle question by sorting it randomly
      const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
      //select the first 5 question from the random sorted questions
      const selectedQuestions = [];
      //if duration is input instead of number of question add question based on
      //duration
      if (req.query.duration) {
        let temp = 0;
        while (temp <= req.query.duration) {
          const index = Math.floor(
            Math.random() * Math.floor(questions.length)
          );
          temp += shuffledQuestions[index].duration;
          if (temp > req.query.duration) {
            break;
          } else {
            selectedQuestions.push(shuffledQuestions[index]);
            shuffledQuestions.splice(index, 1);
          }
        }
      } else {
        for (let i = 0; i < noQues; i++) {
          selectedQuestions.push(shuffledQuestions[i]);
        }
      }

      //calculate total duration for each question
      let totalDuration = 0;
      selectedQuestions.forEach((question) => {
        totalDuration += question.duration;
      });
      //create an exam object
      let exam = {
        ...req.body,
        _id: uniqid(),
        examDate: new Date(),
        isCompleted: false,
        totalDuration: totalDuration,
        questions: selectedQuestions,
      };
      //get exams object and push the new exam into it (with correct answers)
      const exams = await getExams();
      exams.push(exam);
      //write the exam object into exams.json
      await writeExams(exams);

      //remove the correct answer and return it to the user
      selectedQuestions.forEach((question) => {
        question.answers.forEach((answer) => {
          delete answer.isCorrect;
        });
      });
      exam.questions = selectedQuestions;
      res.status(200).send(exam);
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
// }
// in this case, the answer for the first question is the second choice
// When the answer is provided, the result is kept into the exam and the score is updated accordingly.
// It should not be possible to answer the same question twice.
router.post("/exam/:examId/answer", async (req, res, next) => {
  try {
    //get all exams to find selected exam
    const exams = await getExams();
    const selectedExam = exams.find((exam) => exam._id === req.params.examId);
    if (selectedExam) {
      //remove selected exam from all exam so we can add updated exam to it
      const examsWithoutSelected = exams.filter(
        (exam) => exam._id !== req.params.examId
      );

      //check if answer is already provided
      if (selectedExam.questions[req.body.question].providedAnswer) {
        res.send("Answer Provided. Move on.");
      } else {
        //add provided answer into question
        selectedExam.questions[req.body.question].providedAnswer =
          req.body.answer;
        //add score into exam
        let score = 0;
        if (selectedExam.score) {
          score = selectedExam.score;
        } else {
          score = 0;
        }
        //if answer is correct increase score
        if (
          selectedExam.questions[req.body.question].answers[req.body.answer]
            .isCorrect
        ) {
          score++;
        }
        //add updated exam into exams
        selectedExam.score = score;
        //count number of answered question
        let counter = 0;
        selectedExam.questions.forEach((question) => {
          if (question.providedAnswer) {
            counter++;
          }
        });

        //update isCompleted
        if (counter === selectedExam.questions.length) {
          selectedExam.isCompleted = true;
        }
        console.log(counter, selectedExam.questions.length);
        examsWithoutSelected.push(selectedExam);
        await writeExams(examsWithoutSelected);
        //send selected answer as response
        res
          .status(200)
          .send(
            `You selected ${
              selectedExam.questions[req.body.question].answers[req.body.answer]
                .text
            }`
          );
      }
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

//> GET /exams/{id}
// Returns the information about the exam, including the current score.
router.get("/exam/:examId", async (req, res, next) => {
  try {
    const exams = await getExams();
    const selectedExam = exams.find((exam) => exam._id === req.params.examId);
    if (selectedExam) {
      //remove the correct answer and return it to the user
      selectedExam.questions.forEach((question) => {
        question.answers.forEach((answer) => {
          delete answer.isCorrect;
        });
      });
      res.status(200).send(selectedExam);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;

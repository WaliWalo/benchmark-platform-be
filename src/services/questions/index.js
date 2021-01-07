const express = require("express");
const router = express.Router();
const Joi = require("joi");
const {
  getQuestions,
  getExams,
  writeExams,
  writeQuestions,
} = require("../../lib/utilities");
const uniqid = require("uniqid");
const { truncate, read } = require("fs-extra");

const validateQuestionInput = (dataToValidate) => {
  const schema = Joi.object().keys({
    text: Joi.string().min(3).required(),
    duration: Joi.number().min(60).required(),
    answers: Joi.array()
      .items(
        Joi.object({
          text: Joi.string().min(3).required(),
          isCorrect: Joi.bool().required(),
        })
      )
      .length(4),
  });
  console.log(schema.validate(dataToValidate));
  return schema.validate(dataToValidate);
};

//Get all questions
router.get("/", async (req, res, next) => {
  try {
    const questions = await getQuestions();
    console.log(questions.length);
    res.status(200).send(questions);
  } catch (error) {
    next(error);
  }
});

//Post a question
router.post("/", async (req, res, next) => {
  try {
    const { error } = validateQuestionInput(req.body);
    if (error) {
      let err = new Error();
      err.message = error.details[0].message;
      err.httpStatusCode = 400;
      next(error);
    } else {
      const questions = await getQuestions();
      const newQuestion = { ...req.body, _id: uniqid() };
      questions.push(newQuestion);
      await writeQuestions(questions);
      res.status(200).send(newQuestion);
    }
  } catch (error) {
    next(error);
  }
});

//Get single question
router.get("/:questionId", async (req, res, next) => {
  try {
    const questions = await getQuestions();
    const selectedQuestion = questions.find(
      (question) => question._id === req.params.questionId
    );
    if (selectedQuestion) {
      res.status(200).send(selectedQuestion);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

//Update a question
router.put("/:questionId", async (req, res, next) => {
  try {
    const { error } = validateQuestionInput(req.body);
    if (error) {
      let err = new Error();
      err.message = error.details[0].message;
      err.httpStatusCode = 400;
      next(error);
    } else {
      const questions = await getQuestions();
      let selectedQuestion = questions.find(
        (question) => question._id === req.params.questionId
      );
      const questionsWithoutSelected = questions.filter(
        (question) => question._id !== req.params.questionId
      );
      if (selectedQuestion) {
        selectedQuestion = { ...req.body, _id: req.params.questionId };
        questionsWithoutSelected.push(selectedQuestion);
        await writeQuestions(questionsWithoutSelected);
        res.status(200).send(selectedQuestion);
      } else {
        const error = new Error();
        error.httpStatusCode = 404;
        next(error);
      }
    }
  } catch (error) {
    next(error);
  }
});

//Delete a question
router.delete("/:questionId", async (req, res, next) => {
  try {
    const questions = await getQuestions();
    const selectedQuestion = questions.find(
      (question) => question._id === req.params.questionId
    );
    console.log(selectedQuestion);
    if (selectedQuestion) {
      questions.forEach((question) => {
        if (question._id === undefined) {
          question._id = uniqid();
        }
      });
      console.log(questions);
      const questionsWithoutSelected = questions.filter(
        (question) => question._id !== req.params.questionId
      );
      await writeQuestions(questionsWithoutSelected);
      res.status(200).send(`Deleted ${req.params.questionId}`);
    } else {
      let error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});
module.exports = router;

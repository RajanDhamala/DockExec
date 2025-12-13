import mongoose from "mongoose";

const exampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }
});

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expected: { type: String, required: true }
});

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
  description: { type: String, required: true },
  examples: [exampleSchema],
  function_name:{type:String,required:true},
  parameters:[{
    type:String,
    required:true
  }],
wrapper_type: {
  type: String,
  enum: ["simple", "custom"], 
  default: "simple"
},
  constraints: [{ type: String }],
  testCases: { type: [testCaseSchema], default: [] },
  languageTemplates: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

const Problem = mongoose.model("Problem", problemSchema);

export default Problem;

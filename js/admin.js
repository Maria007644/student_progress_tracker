import { collection, deleteDoc, doc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { auth, db } from "./firebase-config.js";

const byId = (id) => document.getElementById(id);
const authLoading = byId("auth-loading"), loginSection = byId("login-section"), dashboard = byId("dashboard");
const loginForm = byId("login-form"), loginError = byId("login-error"), studentList = byId("admin-student-list");
const studentsStatus = byId("admin-students-status"), editorSection = byId("editor-section"), editorTitle = byId("editor-title");
const editorStatus = byId("editor-status"), unitList = byId("admin-unit-list");
let selectedStudent = null;
let currentUnits = [];

const unitNumber = (id) => Number.parseInt(id.match(/\d+/)?.[0] ?? "0", 10);
const calculateAverage = (values) => Math.round(((values.reduce((sum, value) => sum + value, 0) / 3) + Number.EPSILON) * 10) / 10;
const formatScore = (value) => `${Number(value).toFixed(1).replace(".0", "")}%`;
const show = (element, visible) => element.classList.toggle("hidden", !visible);

function showMessage(message, type = "", timeout = 0) {
  editorStatus.className = `status ${type}`.trim();
  editorStatus.textContent = message;
  if (timeout) window.setTimeout(() => { if (editorStatus.textContent === message) editorStatus.textContent = ""; }, timeout);
}

async function loginTeacher(event) {
  event.preventDefault();
  loginError.textContent = "";
  const submit = loginForm.querySelector("button");
  submit.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, byId("email").value.trim(), byId("password").value);
    loginForm.reset();
  } catch (error) {
    console.error(error);
    loginError.textContent = "Incorrect email or password.";
  } finally { submit.disabled = false; }
}

async function loadStudents() {
  studentsStatus.textContent = "Loading...";
  studentList.replaceChildren();
  try {
    const snapshot = await getDocs(collection(db, "students"));
    const students = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => a.name.localeCompare(b.name));
    students.forEach((student) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "student-button"; button.textContent = student.name; button.dataset.id = student.id;
      button.addEventListener("click", () => selectStudent(student));
      studentList.append(button);
    });
    studentsStatus.textContent = students.length ? "" : "No students found.";
  } catch (error) { console.error(error); studentsStatus.textContent = "Could not load progress. Please try again later."; studentsStatus.classList.add("error"); }
}

async function selectStudent(student) {
  selectedStudent = student;
  document.querySelectorAll(".student-button").forEach((button) => button.classList.toggle("selected", button.dataset.id === student.id));
  editorTitle.textContent = student.name;
  show(editorSection, true);
  await loadUnits();
}

async function loadUnits() {
  showMessage("Loading..."); unitList.replaceChildren();
  try {
    const snapshot = await getDocs(collection(db, "students", selectedStudent.id, "units"));
    currentUnits = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => unitNumber(a.id) - unitNumber(b.id));
    renderUnits();
    showMessage(currentUnits.length ? "" : "No progress data yet.");
  } catch (error) { console.error(error); showMessage("Could not load progress. Please try again later.", "error"); }
}

function makeNumberField(label, key, value) {
  const wrapper = document.createElement("label");
  wrapper.textContent = label;
  const input = document.createElement("input");
  input.type = "number"; input.min = "0"; input.max = "100"; input.step = "1"; input.required = true; input.name = key; input.value = Number(value) || 0;
  wrapper.append(input); return wrapper;
}

function renderUnits() {
  unitList.replaceChildren();
  currentUnits.forEach((unit) => {
    const form = document.createElement("form"); form.className = "unit-card edit-card"; form.dataset.unitId = unit.id;
    const heading = document.createElement("div"); heading.className = "card-heading"; heading.innerHTML = `<h3>Unit ${unitNumber(unit.id)}</h3>`;
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "text-button danger"; remove.textContent = "Delete"; remove.addEventListener("click", () => deleteUnit(unit.id)); heading.append(remove);
    const fields = document.createElement("div"); fields.className = "field-grid";
    fields.append(makeNumberField("Vocabulary", "vocabulary", unit.vocabulary), makeNumberField("Grammar", "grammar", unit.grammar), makeNumberField("Speaking", "speaking", unit.speaking));
    const average = document.createElement("div"); average.className = "average-row"; average.innerHTML = `<span>Average</span><strong>${formatScore(unit.average)}</strong>`;
    fields.addEventListener("input", () => { average.querySelector("strong").textContent = formatScore(readValues(form).average); });
    const save = document.createElement("button"); save.type = "submit"; save.className = "button primary"; save.textContent = "Save";
    form.addEventListener("submit", (event) => { event.preventDefault(); saveUnit(form, unit.id); });
    form.append(heading, fields, average, save); unitList.append(form);
  });
}

function readValues(form) {
  const values = ["vocabulary", "grammar", "speaking"].map((key) => Number(form.elements[key].value));
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) throw new Error("Scores must be between 0 and 100.");
  return { vocabulary: values[0], grammar: values[1], speaking: values[2], average: calculateAverage(values) };
}

async function saveUnit(form, unitId) {
  const button = form.querySelector("button[type=submit]");
  try {
    const data = readValues(form); button.disabled = true;
    await setDoc(doc(db, "students", selectedStudent.id, "units", unitId), data);
    const unit = currentUnits.find((item) => item.id === unitId); Object.assign(unit, data);
    showMessage("Saved successfully", "success", 3000);
  } catch (error) { console.error(error); showMessage("Could not save changes.", "error"); }
  finally { button.disabled = false; }
}

async function addUnit() {
  if (!selectedStudent) return;
  const nextNumber = currentUnits.reduce((max, unit) => Math.max(max, unitNumber(unit.id)), 0) + 1;
  try {
    showMessage("Saving...");
    await setDoc(doc(db, "students", selectedStudent.id, "units", `unit${nextNumber}`), { vocabulary: 0, grammar: 0, speaking: 0, average: 0 });
    await loadUnits(); showMessage("Unit added successfully", "success", 3000);
  } catch (error) { console.error(error); showMessage("Could not save changes.", "error"); }
}

async function deleteUnit(unitId) {
  if (!window.confirm(`Delete Unit ${unitNumber(unitId)}? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, "students", selectedStudent.id, "units", unitId));
    await loadUnits(); showMessage("Unit deleted successfully", "success", 3000);
  } catch (error) { console.error(error); showMessage("Could not save changes.", "error"); }
}

loginForm.addEventListener("submit", loginTeacher);
byId("logout-button").addEventListener("click", () => signOut(auth).catch(console.error));
byId("add-unit-button").addEventListener("click", addUnit);
onAuthStateChanged(auth, (user) => {
  show(authLoading, false); show(loginSection, !user); show(dashboard, Boolean(user));
  if (user) loadStudents();
  else { selectedStudent = null; currentUnits = []; show(editorSection, false); }
});

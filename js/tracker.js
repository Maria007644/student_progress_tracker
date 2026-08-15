import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

const studentList = document.querySelector("#student-list");
const studentsStatus = document.querySelector("#students-status");
const progressSection = document.querySelector("#progress-section");
const progressTitle = document.querySelector("#progress-title");
const overallProgress = document.querySelector("#overall-progress");
const progressStatus = document.querySelector("#progress-status");
const unitList = document.querySelector("#unit-list");
let selectedStudentId = null;

const unitNumber = (id) => Number.parseInt(id.match(/\d+/)?.[0] ?? "0", 10);
const formatScore = (value) => `${Number(value || 0).toFixed(1).replace(".0", "")}%`;
const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));

function setError(element, message) {
  element.textContent = message;
  element.classList.add("error");
}

function renderStudents(students) {
  studentList.replaceChildren();
  students.forEach((student) => {
    const button = document.createElement("button");
    button.className = "student-button";
    button.type = "button";
    button.textContent = student.name;
    button.dataset.id = student.id;
    button.addEventListener("click", () => loadStudentProgress(student));
    studentList.append(button);
  });
}

function metricRow(label, value) {
  const safeValue = clamp(value);
  const row = document.createElement("div");
  row.className = "metric";
  row.innerHTML = `<div class="metric-label"><span>${label}</span><strong>${formatScore(safeValue)}</strong></div><div class="bar" aria-hidden="true"><span style="width:${safeValue}%"></span></div>`;
  return row;
}

function renderUnits(units) {
  unitList.replaceChildren();
  units.forEach((unit) => {
    const card = document.createElement("article");
    card.className = "unit-card";
    const title = document.createElement("h3");
    title.textContent = `Unit ${unitNumber(unit.id)}`;
    card.append(title, metricRow("Vocabulary", unit.vocabulary), metricRow("Grammar", unit.grammar), metricRow("Speaking", unit.speaking));
    const average = document.createElement("div");
    average.className = "average-row";
    average.innerHTML = `<span>Average</span><strong>${formatScore(unit.average)}</strong>`;
    card.append(average);
    unitList.append(card);
  });
}

async function loadStudents() {
  try {
    const snapshot = await getDocs(collection(db, "students"));
    const students = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => a.name.localeCompare(b.name));
    renderStudents(students);
    studentsStatus.textContent = students.length ? "" : "No students found.";
  } catch (error) {
    console.error(error);
    setError(studentsStatus, "Could not load progress. Please try again later.");
  }
}

async function loadStudentProgress(student) {
  selectedStudentId = student.id;
  document.querySelectorAll(".student-button").forEach((button) => button.classList.toggle("selected", button.dataset.id === selectedStudentId));
  progressSection.classList.remove("hidden");
  progressTitle.textContent = student.name;
  progressStatus.className = "status";
  progressStatus.textContent = "Loading...";
  unitList.replaceChildren();
  try {
    const snapshot = await getDocs(collection(db, "students", student.id, "units"));
    const units = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => unitNumber(a.id) - unitNumber(b.id));
    if (!units.length) {
      progressStatus.textContent = "No progress data yet.";
      overallProgress.textContent = "0%";
      return;
    }
    const overall = units.reduce((sum, unit) => sum + (Number(unit.average) || 0), 0) / units.length;
    overallProgress.textContent = formatScore(overall);
    progressStatus.textContent = "";
    renderUnits(units);
  } catch (error) {
    console.error(error);
    setError(progressStatus, "Could not load progress. Please try again later.");
  }
}

loadStudents();

async function initDB() {
  try {
    const db = await idb.openCaloriesDB("caloriesdb", 1);
    document.getElementById("dbMessage").innerText = "Connected to IndexedDB successfully!";
    return db;
  } catch (error) {
    document.getElementById("dbMessage").innerText = "Failed to connect to IndexedDB: " + error;
    throw error;
  }
}
document.getElementById("calorieForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const calorie = parseInt(document.getElementById("calorie").value);
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value;

  // קח את התאריך מהקלט
  let date = document.getElementById("date").value;

  // אם לא הוזן תאריך, קח את התאריך הנוכחי וצר אותו לפורמט YYYYMMDD
  if (!date) {
    const today = new Date();
    date = [
      today.getFullYear(),  // שנה
      (today.getMonth() + 1).toString().padStart(2, '0'), // חודש ( עם אפס לפני אם נדרש)
      today.getDate().toString().padStart(2, '0') // יום (עם אפס לפני אם נדרש)
    ].join(''); // חיבור לתאריך בפורמט YYYYMMDD
  } else {
    // אם תאריך הוזן, פרק אותו לפורמט YYYYMMDD בלי מקפים
    const parts = date.split('-'); // הנחת שמדובר בפורמט YYYY-MM-DD
    date = parts[0] + parts[1] + parts[2]; // חיבור התאריכים ל-YEAR + MONTH + DAY
  }

  const db = await initDB();

  try {
    await db.addCalories({ calorie, category, description, date });
    alert("Calories added successfully!");
    document.getElementById("calorieForm").reset();
  } catch (error) {
    alert("Error: " + error);
  }
});


document.getElementById("showReport").addEventListener("click", async function () {
  const db = await initDB();
  const today = new Date();
  const month = today.getMonth() + 1; // חודשים מסודרים משולש אפס
  const year = today.getFullYear();
  const report = await db.getReportByMonthAndYear(month, year);

  const reportDiv = document.getElementById("report");
  reportDiv.innerHTML = ""; // ניקוי תוצאות קודמות

  if (report.length > 0) {
    const reportTable = document.createElement("table");
    reportTable.innerHTML = `
          <tr>
              <th>ID</th>
              <th>Calories</th>
              <th>Category</th>
              <th>Description</th>
              <th>Date</th>
          </tr>
      `;

    // הוספת כל רשומה לטבלה
    report.forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `
              <td>${entry.id}</td>
              <td>${entry.calorie}</td>
              <td>${entry.category}</td>
              <td>${entry.description}</td>
              <td>${entry.date}</td>
          `;
      reportTable.appendChild(row);
    });

    reportDiv.appendChild(reportTable);
  } else {
    reportDiv.innerText = `No entries found for ${month}/${year}.`;
  }
});


document.getElementById("deleteRecord").addEventListener("click", async function () {
  const db = await initDB();
  const idToDelete = parseInt(document.getElementById("deleteId").value);
  try {
    await db.deleteCalories(idToDelete); // כתוב פונקציה deleteCalories בקוד idb.js
    document.getElementById("deleteMessage").innerText = "Record deleted successfully!";
    document.getElementById("deleteId").value = ""; // ניקוי השדה
  } catch (error) {
    document.getElementById("deleteMessage").innerText = "Error deleting record: " + error;
  }
});

document.getElementById("updateRecord").addEventListener("click", async function () {
  const db = await initDB();
  const idToUpdate = parseInt(document.getElementById("updateId").value);
  const calorie = parseInt(document.getElementById("updateCalorie").value);
  const category = document.getElementById("updateCategory").value;
  const description = document.getElementById("updateDescription").value;

  // קובעים את התאריך שנשמר כמו שהתבקש
  let date = document.getElementById("updateDate").value;

  // אם לא הוזן תאריך, קח את התאריך הנוכחי בפורמט YYYYMMDD
  if (!date) {
    const today = new Date();
    date = [
      today.getFullYear(), // שנה
      (today.getMonth() + 1).toString().padStart(2, '0'), // חודש (עם אפס לפני אם נדרש)
      today.getDate().toString().padStart(2, '0') // יום (עם אפס לפני אם נדרש)
    ].join(''); // חיבור ל-YEAR + MONTH + DAY
  } else {
    // אם תאריך הוזן, פרק אותו לפורמט YYYYMMDD בלי מקפים
    const parts = date.split('-'); // הנחת שמדובר בפורמט YYYY-MM-DD
    date = parts[0] + parts[1] + parts[2]; // חיבור לערכים ללא מקפים
  }

  try {
    await db.updateCalories(idToUpdate, { calorie, category, description, date }); // מימוש הפונקציה בקובץ idb.js
    document.getElementById("updateMessage").innerText = "Record updated successfully!";
    document.getElementById("updateId").value = "";
    document.getElementById("updateCalorie").value = "";
    document.getElementById("updateDescription").value = "";
    document.getElementById("updateDate").value = "";
  } catch (error) {
    document.getElementById("updateMessage").innerText = "Error updating record: " + error;
  }
});


document.getElementById("dateRangeForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const startDate = document.getElementById("startDate").value.replace(/-/g, ''); // הפוך את התאריך לפורמט נכון
  const endDate = document.getElementById("endDate").value.replace(/-/g, ''); // הפוך את התאריך לפורמט נכון

  const db = await initDB();
  try {
    const report = await db.getRecordsByDateRange(startDate, endDate);

    const dateRangeReportDiv = document.getElementById("dateRangeReport");
    dateRangeReportDiv.innerHTML = ""; // ניקוי תוצאות קודמות

    if (report.length > 0) {
      const reportTable = document.createElement("table");
      reportTable.innerHTML = `
              <tr>
                  <th>ID</th>
                  <th>Calories</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Date</th>
              </tr>
          `;

      report.forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = `
                  <td>${entry.id}</td>
                  <td>${entry.calorie}</td>
                  <td>${entry.category}</td>
                  <td>${entry.description}</td>
                  <td>${entry.date}</td>
              `;
        reportTable.appendChild(row);
      });

      dateRangeReportDiv.appendChild(reportTable);
    } else {
      dateRangeReportDiv.innerText = "No entries found for the selected date range.";
    }
  } catch (error) {
    console.error("Failed to fetch records by date range: ", error);
    dateRangeReportDiv.innerText = "Error fetching records.";
  }
});
/*
document.getElementById("dateRangeForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  // הפוך את תאריכים לפורמט YYYYMMDD
  const startDateFormatted = startDate.replace(/-/g, '');
  const endDateFormatted = endDate.replace(/-/g, '');

  const db = await initDB();
  try {
    const report = await db.getRecordsByDateRange(startDateFormatted, endDateFormatted);

    const dateRangeReportDiv = document.getElementById("dateRangeReport");
    dateRangeReportDiv.innerHTML = ""; // ניקוי תוצאות קודמות

    if (report.length > 0) {
      const reportTable = document.createElement("table");
      reportTable.innerHTML = `
              <tr>
                  <th>ID</th>
                  <th>Calories</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Date</th>
              </tr>
          `;

      report.forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = `
                  <td>${entry.id}</td>
                  <td>${entry.calorie}</td>
                  <td>${entry.category}</td>
                  <td>${entry.description}</td>
                  <td>${entry.date}</td>
              `;
        reportTable.appendChild(row);
      });

      dateRangeReportDiv.appendChild(reportTable);
    } else {
      dateRangeReportDiv.innerText = `No entries found between ${startDate} and ${endDate}.`;
    }
  } catch (error) {
    document.getElementById("dateRangeReport").innerText = "Error fetching records: " + error;
  }
});

*/

// פונקציה להציג לשוניות
function showTab(tabId) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.style.display = 'none'; // מסתיר את כל הלשוניות
  });

  document.getElementById(tabId).style.display = 'block'; // מציג את הלשונית הנבחרת

  // עדכון צבע הלשונית הפעילה
  const buttons = document.querySelectorAll('.tab-button');
  buttons.forEach(button => {
    button.classList.remove('active-tab'); // מסיר את הלשונית הפעילה
  });

  const activeButton = Array.from(buttons).find(button => button.innerText === tabId.replace('Tab', ' ').trim());
  if (activeButton) {
    activeButton.classList.add('active-tab'); // מוסיף צבע ללשונית הפעילה
  }
}



/*
document.getElementById("showReport").addEventListener("click", async function () {
  const db = await initDB();
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const report = await db.getReportByMonthAndYear(month, year);

  const reportDiv = document.getElementById("report");
  reportDiv.innerHTML = "";

  if (report.length > 0) {
    const reportTable = document.createElement("table");
    reportTable.innerHTML = `
          <tr>
                                      <th>ID</th>
                        <th>Calories</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Date</th>
                    </tr>
                `;

    report.forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `
                        <td>${entry.id}</td>
                        <td>${entry.calorie}</td>
                        <td>${entry.category}</td>
                        <td>${entry.description}</td>
                        <td>${entry.date}</td>
                    `;
      reportTable.appendChild(row);
    });

    reportDiv.appendChild(reportTable);
  } else {
    reportDiv.innerText = `No entries found for ${month}/${year}.`;
  }
});
*/
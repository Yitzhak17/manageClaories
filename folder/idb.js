/*

*/

const idb = {};


idb.openCaloriesDB = async function (dbName, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onerror = (event) => {
      console.error("An error occured trying to open IndexedDB:\n", event);
      reject(event);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const store = db.createObjectStore("calories", {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("calories_date", "date", { unique: false });
      store.createIndex("calories_category", "category", { unique: false });

    };


    request.onsuccess = (event) => {
      const db = event.target.result

      db.addCalories = async function (calorieObj) {
        return new Promise((resolve, reject) => {

          const alerts = [];

          if (!calorieObj.calorie || typeof calorieObj.calorie !== 'number' || calorieObj.calorie < 0) {
            alerts.push("Invalid calorie value!");
          }

          if (!calorieObj.category || !["breakfast", "lunch", "dinner", "other"].includes(calorieObj.category.toString().toLowerCase())) {
            alerts.push("Invalid category!");
          }

          if (!calorieObj.description || calorieObj.description.trim() === "") {
            alerts.push("Description is required!");
          }

          if (alerts.length > 0) {
            return reject(alerts.join(" "));
          }

          if (!calorieObj.date || isNaN(Date.parse(calorieObj.date))) {
            const today = new Date();
            calorieObj.date = [
              today.getFullYear(),
              (today.getMonth() + 1).toString().padStart(2, '0'),
              today.getDate().toString().padStart(2, '0')
            ].join('');
          }



          const transaction = db.transaction("calories", "readwrite");
          const store = transaction.objectStore("calories");
          const request = store.add(calorieObj);


          request.onerror = (event) => {
            console.error("Failed to add calories:\n", event);
            reject(event);
          };


          request.onsuccess = (event) => {
            resolve(event);

          };


        });
      };


      db.getReportByMonthAndYear = async function (month, year) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction("calories", "readonly");
          const store = transaction.objectStore("calories");
          const index = store.index("calories_date");

          const request = index.openCursor()

          const reportRequest = []

          request.onsuccess = function (event) {
            const cursor = event.target.result;

            if (cursor) {
              const entry = cursor.value;
              const entryDate = entry.date
              const entryYear = parseInt(entryDate.substring(0, 4), 10);
              const entryMonth = parseInt(entryDate.substring(4, 6), 10);


              if (entryMonth === month && entryYear === year) {
                reportRequest.push({
                  id: entry.id,
                  calorie: entry.calorie,
                  category: entry.category,
                  description: entry.description,
                  date: entryDate
                });
              }


              cursor.continue();
            } else {

              resolve(reportRequest);
            }
          };

          request.onerror = function (event) {
            console.error("Failed to get calories:\n", event);
            return reject(event);
          };

        });
      };

      db.deleteCalories = async function (id) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction("calories", "readwrite");
          const store = transaction.objectStore("calories");
          const request = store.delete(id);

          request.onsuccess = () => resolve();
          request.onerror = (event) => reject("Failed to delete record: " + event);
        });
      };

      db.updateCalories = async function (id, calorieObj) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction("calories", "readwrite");
          const store = transaction.objectStore("calories");
          const request = store.get(id);

          request.onsuccess = function (event) {
            const data = event.target.result;
            if (!data) {
              return reject("Record not found.");
            }

            // עדכון הערכים
            data.calorie = calorieObj.calorie;
            data.category = calorieObj.category;
            data.description = calorieObj.description;
            data.date = calorieObj.date;

            const updateRequest = store.put(data); // מעדכן את הרשומה

            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = (event) => reject("Failed to update record: " + event);
          };

          request.onerror = function (event) {
            reject("Failed to retrieve record: " + event);
          };
        });
      };

      db.getRecordsByDateRange = async function (startDate, endDate) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction("calories", "readonly");
          const store = transaction.objectStore("calories");
          const index = store.index("calories_date");

          const reportRequest = [];

          const request = index.openCursor(IDBKeyRange.bound(startDate, endDate));

          request.onsuccess = function (event) {
            const cursor = event.target.result;

            if (cursor) {
              const entry = cursor.value;
              reportRequest.push({
                id: entry.id,
                calorie: entry.calorie,
                category: entry.category,
                description: entry.description,
                date: entry.date
              });

              cursor.continue();
            } else {
              resolve(reportRequest);
            }
          };

          request.onerror = function (event) {
            console.error("Failed to get records by date range:\n", event);
            reject(event);
          };
        });
      };


      resolve(db);
    };
  });
};






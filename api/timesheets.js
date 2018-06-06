const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//For each call to timesheetId, check for timesheet existence and attach the timesheet to the req
timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = "SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId;";
  const values = {$timesheetId: timesheetId};
  db.get(sql, values, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      req.timesheet = timesheet;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//Get all timesheets for a single employee
timesheetsRouter.get('/', (req, res, next) => {
  const sql = "SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId;";
  const values = {$employeeId: req.params.employeeId};
  db.all(sql, values, (error, timesheets) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({timesheets: timesheets});
    }
  });
});

//Add a new timesheet to an employee
timesheetsRouter.post('/', (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  const hours = newTimesheet.hours,
        rate = newTimesheet.rate,
        date = newTimesheet.date,
        employeeId = req.params.employeeId;
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const employeeValues = {$employeeId: employeeId};
  db.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!hours || !rate || !date || !employee) {
        return res.sendStatus(400);
      }

      const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id)
        VALUES ($hours, $rate, $date, $employeeId)`;
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId
      };

      db.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
            (error, timesheet) => {
              res.status(201).json({timesheet: timesheet});
            });
        }
      });
    }
  });
});

//Update a timesheet on a single employee by id
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const updatedTimesheet = req.body.timesheet;
  const hours = updatedTimesheet.hours,
        rate = updatedTimesheet.rate,
        date = updatedTimesheet.date,
        employeeId = req.params.employeeId;
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const employeeValues = {$employeeId: employeeId};
  db.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!hours || !rate || !date || !employee) {
        return res.sendStatus(400);
      }

      const sql = `UPDATE Timesheet
        SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId
        WHERE id = $timesheetId`;
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId,
        $timesheetId: req.params.timesheetId
      };

      db.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`,
            (error, timesheet) => {
              res.status(200).json({timesheet: timesheet});
            });
        }
      });
    }
  });
});

//Delete an employee's timesheet by id
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const employeeId = req.params.employeeId;
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const employeeValues = {$employeeId: employeeId};
  db.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!employee) {
        return res.sendStatus(400);
      }

      const sql = `DELETE FROM Timesheet
        WHERE Timesheet.id = $timesheetId`;
      const values = {
        $timesheetId: req.params.timesheetId
      };

      db.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});

//Export the timesheetsRouter
module.exports = timesheetsRouter;

const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Import the timesheets router
const timesheetsRouter = require('./timesheets.js');

//For each call to employeeId, check for employee existence and attach the employee to the req
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const values = {$employeeId: employeeId};
  db.get(sql, values, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//Use the timesheetsRouter for any call to /:employeeId/timesheets
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

//Get all employees
employeesRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Employee WHERE Employee.is_current_employee = 1", (error, employees) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({employees: employees});
    }
  });
});

//Get employee by id
employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

//Add new employee
employeesRouter.post('/', (req, res, next) => {
  const newEmployee = req.body.employee;

  const name = newEmployee.name,
        position = newEmployee.position,
        wage = newEmployee.wage,
        isCurrentEmployee = newEmployee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = `INSERT INTO Employee (name, position, wage, is_current_employee)
  VALUES ($name, $position, $wage, $isCurrentEmployee)`;
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
        (error, employee) => {
          res.status(201).json({employee: employee});
        });
    }
  });
});

//Update employee by id
employeesRouter.put('/:employeeId', (req, res, next) => {
  const updatedEmployee = req.body.employee;

  const name = updatedEmployee.name,
        position = updatedEmployee.position,
        wage = updatedEmployee.wage,
        isCurrentEmployee = updatedEmployee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = `UPDATE Employee
  SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee
  WHERE id = $employeeId`;
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee,
    $employeeId: req.params.employeeId
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

//Delete employee by id
employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = `UPDATE Employee
  SET is_current_employee = 0
  WHERE id = $employeeId`;
  const values = {$employeeId: req.params.employeeId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

//Export the employeesRouter
module.exports = employeesRouter;

const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Import the menuItems router
const menuItemsRouter = require('./menu-items.js');

//For each call to menuId, check for menu existence and attach the menu to the req
menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const values = {$menuId: menuId};
  db.get(sql, values, (error, menu) => {
    if (error) {
      next(error);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//Use the menuItemsRouter for any call to /:menuId/menu-items
menusRouter.use('/:menuId/menu-items', menuItemsRouter);

//Get all menus
menusRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Menu", (error, menus) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({menus: menus});
    }
  });
});

//Get a single menu by id
menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

//Add a new menu
menusRouter.post('/', (req, res, next) => {
  const newMenu = req.body.menu;

  const title = newMenu.title;

  if (!title) {
    return res.sendStatus(400);
  }

  const sql = `INSERT INTO Menu (title)
  VALUES ($title);`;
  const values = {
    $title: title
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
        (error, menu) => {
          res.status(201).json({menu: menu});
        });
    }
  });
});

//Update a single menu by id
menusRouter.put('/:menuId', (req, res, next) => {
  const updatedMenu = req.body.menu;

  const title = updatedMenu.title;

  if (!title) {
    return res.sendStatus(400);
  }

  const sql = `UPDATE Menu
  SET title = $title
  WHERE id = $menuId`;
  const values = {
    $title: title,
    $menuId: req.params.menuId
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`,
        (error, menu) => {
          res.status(200).json({menu: menu});
        });
    }
  });
});

//Delete a single menu by id
menusRouter.delete('/:menuId', (req, res, next) => {
  const menuItemsSql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const menuItemsValues = {$menuId: req.params.menuId};
  db.get(menuItemsSql, menuItemsValues, (error, menuItem) => {
    if (error) {
      next(error);
    } else if (menuItem) {
      res.sendStatus(400);
    } else {
      const deleteSql = 'DELETE FROM Menu WHERE Menu.id = $menuId';
      const deleteValues = {$menuId: req.params.menuId};

      db.run(deleteSql, deleteValues, (error) => {
        if (error) {
          next(error);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});

//Export the menus router
module.exports = menusRouter;

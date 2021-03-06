const auth = require('http-auth');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
// vvv Middleware that provides useful methods for the sanitization and validation of user input.
const { check, validationResult } = require('express-validator');

const router = express.Router();
const Registration = mongoose.model('Registration');
const basic = auth.basic({
	file: path.join(__dirname, '../users.htpasswd'),
});

/**
 * Telling our route to use our new template.
 * This uses the render method on Express’s response object to send the rendered view to the client.
 */
router.get('/', (req, res) => {
	res.render('form', { title: 'Registration form' });
});

const validation = [
	check('name').isLength({ min: 1 }).withMessage('Please enter a name'),
	check('email').isLength({ min: 1 }).withMessage('Please enter an email'),
];

/**
 * This is the same as the one above, except that we’re using `router.post` to respond to a different HTTP verb.
 */
router.post('/', validation, (req, res) => {
	// We can call the `validationResult` method to see if validation passed or failed.
	const errors = validationResult(req);

	/**
	 * If validation passes we can go ahead and create a new `Registration` object and attempt to save it.
	 * The database operation is asynchronous and returns a Promise, we can chain a .then() onto the end of it to deal
	 * with a successful insert and a .catch() to deal with any errors.
	 *
	 * In `else`, we’re passing the errors back to our template, so as to inform the user that something’s wrong.
	 * If validation fails, we’ll need to pass `req.body` back to the template so that any valid form inputs aren’t reset.
	 */
	if (errors.isEmpty()) {
		const registration = new Registration(req.body);
		registration
			.save()
			.then(() => res.send('Thank you for your registration!'))
			.catch(err => {
				console.log(err);
				res.send('Sorry! Something went wrong.');
			});
	} else {
		res.render('form', {
			title: 'Registration form',
			errors: errors.array(),
			data: req.body,
		});
	}
});
/**
 * We’re using the `find` method, which will return all of the records in the collection.
 * Because the database lookup is asynchronous, we’re waiting for it to complete before rendering the view.
 * If any records were returned, these will be passed to the view template in the registrations property.
 * If no records were returned registrations will be an empty array.
 *
 * `basic.check` protect this route. When we try to access it, we need to pass a login/password
 */
router.get(
	'/registrations',
	basic.check((req, res) => {
		Registration.find()
			.then(registrations => {
				res.render('index', { title: 'Listing registrations', registrations });
			})
			.catch((err) => {
				console.log(err);
				res.send('Sorry! Something went wrong.');
			});
	})
);

module.exports = router;

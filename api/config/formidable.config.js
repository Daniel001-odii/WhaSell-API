const formidable = require('formidable');

const initializeFormidable = () => {
  const form = formidable.formidable({
    multiples: true, // Enable multiple file uploads
  });
  return form;
};

module.exports = { initializeFormidable };
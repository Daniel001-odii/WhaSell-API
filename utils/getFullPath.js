const getFullUrl = (req, filePath) => {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/${filePath.replace(/\\/g, '/')}`;
};


module.exports = getFullUrl;
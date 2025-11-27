const db = require('../config/db');

exports.getAddressConfig = (req,res) =>{
    const {estate_id} = req.params;
    const sql = `SELECT * FROM estate_address_config WHERE estate_id = ?`;


    db.query(sql, [estate_id], (err,results)=>{
        if(err) return res.status(500).json({error :err.message});
        if (results.length === 0){
            return res.status(200).json({
                street:true,
                section:true,
                court:true,
            })
        }
        return res.json(results[0])
    })

};



// Create Estate
exports.createEstateAddress = (req, res) => {
    const  { estate_id,show_street, show_section,show_court } = req.body;
      
    const sql = 'INSERT INTO estate_address_config (estate_id,show_street, show_section,show_court) VALUES (?,?,?,?)';

    db.query(sql, [
        estate_id,show_street, show_section,show_court
    ], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Estate Config created successfully', estateId: result.insertId });
    });
};

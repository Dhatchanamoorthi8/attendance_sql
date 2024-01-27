const express = require("express");
const cors = require("cors");
const sql = require('mssql');
const server = express();
server.use(cors());
server.use(express.json());
const multer = require('multer');
const XLSX = require('xlsx');

const upload = multer({ dest: 'uploads/' });


const PORT = process.env.PORT || 3002;

const config = {
  server: '122.165.75.134',
  database: 'attendance',
  user: 'sa',
  password: 'rspm@123',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const db = new sql.ConnectionPool(config);

// Connect to the database
db.connect().then(() => {
  console.log('Connected to the database');
}).catch(err => {
  console.error('Database connection failed:', err);
});


//  Default Images....

const getDefaultImageBase64 = () => {
  const fs = require('fs');
  const defaultImageBuffer = fs.readFileSync('./uploads/emptyprofile.png');
  return defaultImageBuffer.toString('base64');
};


// Execute Query

server.get('/totalpresentabsent-count', (req, res) => {
  db.query('exec totalpresentabsentcount', (err, result) => {
    if (err) {
      console.log(err, "totalpresentabsent-coun");
    }

    else {
      res.send(result.recordset)
    }
  })
})

server.get('/profile-card-dashboard', (req, res) => {
  db.query(`
  SELECT top 5 empoloyeemaster.employeename, empoloyeemaster.empoloyeecode ,empoloyeemaster.photo
  FROM attendance.dbo.empoloyeemaster 
  JOIN attendance.dbo.lms_attendancedetails 
  ON empoloyeemaster.empoloyeecode = lms_attendancedetails.EmployeeCode 
  WHERE (CAST(lms_attendancedetails.InTime AS DATE) = CAST(getDATE() AS DATE)) 
  ORDER BY lms_attendancedetails.InTime DESC
  `, (err, result) => {
    if (err) {
      console.log(err, "profile-card-dashboard");
    } else {
      res.send(result.recordset);
    }
  });
});



server.get('/TotalAmount-Today', (req, res) => {
  db.query(`SELECT IsNULL(SUM(TotalAmount), 0) AS TotalAmount 
  FROM attendance.dbo.TransactionHistory 
  WHERE convert(date,Createddate) = convert(date,getDATE())`, (err, result) => {
    if (err) {
      console.log(err, "TotalAmount-day");
    }
    else res.send(result.recordset);
  });
});

server.get('/TotalAmount-Month', (req, res) => {
  db.query(`SELECT IsNULL(SUM(TotalAmount), 0) AS TotalAmount 
            FROM attendance.dbo.TransactionHistory 
            WHERE MONTH(Createddate) = MONTH(getDATE());`, (err, result) => {
    if (err) {
      console.log(err, "TotalAmount-month");
    }
    else res.send(result.recordset);
  });
});



server.get('/TotalAmount-Year', (req, res) => {
  db.query(`SELECT IsNULL(SUM(TotalAmount), 0) AS TotalAmount 
  FROM attendance.dbo.TransactionHistory 
  WHERE YEAR(Createddate) = YEAR(getDATE());`, (err, result) => {
    if (err) {
      console.log(err, "TotalAmount-Year");
    }
    else res.send(result.recordset);
  });
});

server.get('/TotalEnquiry-Count', (req, res) => {
  db.query(`SELECT IsNULL(COUNT(*), 0) AS EnquiryCount 
            FROM attendance.dbo.Enquiry 
            WHERE Status = 'P' AND Responseid = '2';`, (err, result) => {
    if (err) {
      console.log(err, "TotalEnquiry-Count");
    }
    else res.send(result.recordset);
  });
});

server.get('/EnquiryAssignedTrainee-Count', (req, res) => {
  db.query(`SELECT IsNULL(COUNT(*), 0) AS EnquiryAssignedTraineeCount 
            FROM attendance.dbo.Enquiry 
            WHERE Status = 'P' AND Responseid = '2' AND AssignedUser IS NOT NULL;`, (err, result) => {
    if (err) {
      console.log(err, "EnquiryAssignedTrainee-Count");
    }
    else res.send(result.recordset);
  });
});

server.get('/EnquiryClose-Count', (req, res) => {
  db.query(`SELECT IsNULL(COUNT(*), 0) AS EnquiryCloseCount 
            FROM attendance.dbo.Enquiry 
            WHERE Status = 'C' AND Responseid = '1';`, (err, result) => {
    if (err) {
      console.log(err, "EnquiryClose-Count");
    }
    else res.send(result.recordset);
  });
});



server.get('/TotalEnquiry-Count-NullAssignedUser', (req, res) => {
  db.query(`SELECT IsNULL(COUNT(*), 0) AS EnquiryCount 
  FROM attendance.dbo.Enquiry 
  WHERE Status = 'P' AND Responseid = '2' AND AssignedUser IS NULL`, (err, result) => {
    if (err) {
      console.log(err, "TotalEnquiry-Count-NullAssignedUser");
    }
    else res.send(result.recordset);
  });
});

server.get('/total-amount', (req, res) => {
  db.query(`
  SELECT isnull(SUM(TotalAmount),0) AS TotalAmount
  FROM attendance.dbo.transactionhistory
  WHERE convert(date,Createddate)=CONVERT(date,getdate())
  `, (err, result) => {
    if (err) {
      console.log(err, "total amount");
    } else {
      res.send(result.recordset);
    }
  });
});

// Login Querys 

server.get('/forgetpassword', (req, res) => {
  const value = "A"
  db.query(`select usercode from attendance.dbo.usermaster with(nolock)  where userstatus ='${value}'`, (err, result) => {
    if (err) {
      console.log(err, 'forgetpassword');
    }
    else {
      res.send(result.recordset)
    }
  })
})

server.put('/forgetpassword-change', (req, res) => {
  const { usercode, newpassword, confirmpassword } = req.body;
  db.query(
    `UPDATE attendance.dbo.usermaster 
    SET password = '${newpassword}', confirmpassword = '${confirmpassword}' 
    WHERE usercode = '${usercode}'`,
    (err, result) => {
      if (err) {
        console.log(err, 'forgetpassword-change');
      } else {
        res.send(result.recordset);
      }
    }
  );
});

server.put('/changepassword', (req, res) => {
  const { newpassword, confirmpassword, usercode } = req.body
  db.query(`UPDATE attendance.dbo.usermaster SET password = '${newpassword}', confirmpassword = '${confirmpassword}' WHERE usercode = '${usercode}'`, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result.recordset);
    }
  })
});


server.get('/login', async (req, res) => {
  const name = req.query.name;
  try {
    const result = await db.query`SELECT um.userid,um.usercode,um.username,um.userstatus,utype.Description,um.password FROM usermaster um WITH (NOLOCK) JOIN usertypemaster utype WITH (NOLOCK) ON um.usertype = utype.usertypeid WHERE um.usercode = ${name}`;
    console.log(result);
    res.send(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error occurred');
  }
});

server.get('/getcompany_data', (req, res) => {
  db.query('SELECT * FROM attendance.dbo.companymaster with(nolock) ORDER BY companyid Desc', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/getbranch_data', (req, res) => {
  db.query('SELECT * FROM attendance.dbo.branchmaster with(nolock) ORDER BY branchid Desc', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/getdivison_data', (req, res) => {
  db.query('SELECT * FROM attendance.dbo.divisionmaster with(nolock) ORDER BY divisionid Desc', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/getdepartment_data', (req, res) => {
  db.query('SELECT * FROM attendance.dbo.departmentmaster with(nolock) ORDER BY departmentid Desc', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/getdesgination_data', (req, res) => {
  db.query('SELECT * FROM attendance.dbo.designationmaster with(nolock) ORDER BY designationid Desc', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/getActiveEmployees', (req, res) => {
  const value = 'Active';
  db.query(`SELECT * FROM attendance.dbo.empoloyeemaster with(nolock) WHERE status = '${value}' ORDER BY employeeid DESC`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.post('/searchEmployees', (req, res) => {
  const { employeename, employeecode, status } = req.body;
  const query = `SELECT * FROM attendance.dbo.empoloyeemaster with(nolock) WHERE status = @status AND (empoloyeecode = @employeecode OR employeename = @employeename)`;

  db.request()
    .input('status', status)
    .input('employeecode', employeecode)
    .input('employeename', employeename)
    .query(query, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error retrieving data');
      } else {
        console.log('success');
        res.send(result.recordset);
      }
    });
});

server.get('/EmployeeExportdata', (req, res) => {
  db.query('SELECT * FROM attendance.dbo.empoloyeemaster', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/enquiry-datas', (req, res) => {
  db.query('SELECT row_number()over(order by Enquiryid desc) Sno,Enquiryid,CustomerName,Emailid,MobileNo,Remarks  FROM attendance.dbo.enquiry', (err, result) => {
    if (err)
      throw err
    else {
      res.send(result.recordset)
    }
  })
})

server.get('/enquire-table-data', (req, res) => {
  const status = 'p';
  const responsid = '2'
  db.query(`SELECT row_number()over(order by Enquiryid desc) Sno,Enquiryid,CustomerName,Emailid,MobileNo,Remarks,AssignedUser FROM attendance.dbo.enquiry where Status = '${status}' and Responseid = '${responsid}'`, (err, result) => {
    if (err)
      throw err
    else {
      res.send(result.recordset)
    }
  })
})


server.get('/select-traine-dropdown', (req, res) => {
  const responsid = 'TRAINEE';
  db.query(`SELECT empoloyeemaster.employeeid,employeename
  FROM empoloyeemaster
  JOIN designationmaster ON empoloyeemaster.designationid = designationmaster.designationid
  WHERE designationmaster.designationname = '${responsid}'`, (err, result) => {
    if (err)
      throw err
    else {
      res.send(result.recordset)
    }
  })
})


server.get("/select-typeofpack", (req, res) => {
  const status = 'a'
  const query = `SELECT row_number()over(order by packid desc) Sno,packid,TypeofPack,Amount,Gst FROM attendance.dbo.packmaster where delstatus ='${status}'`
  db.query(query, (err, result) => {
    if (err)
      throw err
    else {
      res.send(result.recordset)
    }
  })
})

server.get('/search-employeecode-billing', (req, res) => {
  const value = req.query.value
  db.query(`SELECT empoloyeemaster.employeename, enquiry.MobileNo
  FROM attendance.dbo.empoloyeemaster WITH (NOLOCK)
  INNER JOIN attendance.dbo.enquiry WITH (NOLOCK) ON enquiry.CustomerName = empoloyeemaster.employeename
  WHERE empoloyeecode = '${value}';
   `, (err, result) => {
    if (err) {
      console.log(err, "companyprofile");
    }
    else {
      res.send(result.recordset)
      console.log(result.recordset);
    }

  })
})

server.get('/companyprofile', (req, res) => {
  const status = 'a'
  db.query(`SELECT row_number()over(order by Compinfoid desc) Sno,Compinfoid,Companyname,Address1,Address,Pincode,State,District,CompanyPhoto  
  FROM attendance.dbo.companyprofileinfo where delstatus ='${status}' ORDER BY  Compinfoid DESC
  OFFSET 0 ROWS FETCH NEXT 1 ROW ONLY;`, (err, result) => {
    if (err) {
      console.log(err, "companyprofile");
    }
    else {
      res.send(result.recordset)
    }
  })
})

server.get('/transcation_data', (req, res) => {
  const status = 'a'
  db.query(`SELECT row_number()over(order by transid desc) Sno,transid,Employeecode,CustomerName,MobileNo,TypeofPack,Amount,Discount,Gst,TotalAmount  FROM attendance.dbo.transactionhistory where delstatus ='${status}'`, (err, result) => {
    if (err) {
      console.log(err, "transcation_data");
    }
    else {
      res.send(result.recordset)
    }
  })

})

server.get('/bill_printing_data', (req, res) => {
  const status = 'a';
  db.query(
    `SELECT  top 1 row_number() over(order by transid desc) Sno,transid,Employeecode,CustomerName,MobileNo,TypeofPack,Amount,Discount,Gst,TotalAmount FROM attendance.dbo.transactionhistory WHERE delstatus = '${status}' ORDER BY transid DESC`,
    (err, result) => {
      if (err) {
        console.log(err, "bill_printing_data");
      }
      else {
        res.send(result.recordset);
      }
    }
  );
});

// report query

server.get('/daily_monthly_report', (req, res) => {
  const { fromDate, toDate, mode, employeecode } = req.query;
  db.query(`exec daily_monthly_report '${fromDate}','${toDate}','${mode}','${employeecode}'`, (err, result) => {
    if (err) {
      console.log(err);
    }
    else {
      console.log(result);
      res.send(result.recordset)
    }
  })
});

server.get('/attendance_log_reports', (req, res) => {
  const { fromDate, toDate, mode, employeecode } = req.query;

  db.query(`exec attendance_log_reports '${fromDate}','${toDate}','${mode}','${employeecode}'`, (err, result) => {
    if (err) {
      console.log(err);
    }
    else {
      console.log(result);
      res.send(result.recordset)
    }
  })
});

server.get('/sp_enquiryreport', (req, res) => {
  const { fromDate, toDate, mode } = req.query;
  console.log(fromDate, toDate, mode)
  db.query(`exec sp_enquiryreport '${fromDate}','${toDate}','${mode}'`, (err, result) => {
    if (err) {
      console.log(err);
    }
    else {
      console.log(result);
      res.send(result.recordset)
    }
  })
});

server.get('/sp_Salesreport', (req, res) => {
  const { fromDate, toDate } = req.query;
  console.log(fromDate, toDate)
  db.query(`exec sp_Salesreport '${fromDate}','${toDate}'`, (err, result) => {
    if (err) {
      console.log(err);
    }
    else {
      console.log(result);
      res.send(result.recordset)
    }
  })
});


//  insert query
server.post('/post', (req, res) => {
  const { company_name, status, createdby } = req.body
  console.log(company_name, status, createdby);

  const reg = /[^'"\\]+/g;
  var value = company_name.replace(reg, company_name);

  db.query(
    `INSERT INTO attendance.dbo.companymaster(companyname,status,createdby) VALUES('${value}','${status}','${createdby}') `,
    (err, result) => {
      if (err) {
        const errorMessage = `Error inserting data Companymaster Page: ${err}`;
        const currentDate = new Date().toLocaleString();
        const logData = `${errorMessage}`;
        const date = `${currentDate}`;
        db.query(
          `INSERT INTO attendance.dbo.err_log(error_logs, date) 
          VALUES ('${logData}', '${date}')`,
          (error, Result) => {
            if (error) {
              res.send(error)
            } else {
              res.send(Result)
            }
          }
        );
      } else {
        console.log(result, "sucesss");
        res.status(200).send('Data inserted successfully');
      }
    }
  );
});

server.post('/branch_post', (req, res) => {
  const { companyid, branchname, status, createdBy } = req.body;

  const reg = /[^'"\\]+/g;
  var value = branchname.replace(reg, branchname);

  db.query(
    `INSERT INTO attendance.dbo.branchmaster(companyid, branchname, status, createdby) 
    VALUES ('${companyid}', '${value}', '${status}','${createdBy}')`,
    (err, result) => {
      if (err) {
        const errorMessage = `Error inserting data Branchmaster Page: ${err}`;
        const currentDate = new Date().toLocaleString();
        const logData = `${errorMessage}`;
        const date = `${currentDate}`;
        db.query(
          `INSERT INTO attendance.dbo.err_log(error_logs, date) 
          VALUES ('${logData}', '${date}')`,
          (error, Result) => {
            if (error) {
              res.send(error)
            } else {
              res.send(Result)
            }
          }
        );
        res.status(500).send('Error inserting data');
      } else {
        console.log(result);
        res.status(200).send('Data inserted successfully');
      }
    }
  );
});

server.post('/Divison_post', (req, res) => {

  const { Branchid, divisionname, status, createdBy } = req.body

  const reg = /[^'"\\]+/g;
  var value = divisionname.replace(reg, divisionname);

  db.query(
    `INSERT INTO attendance.dbo.divisionmaster(branchid,divisionname,status,createdby) VALUES ('${Branchid}', '${value}','${status}','${createdBy}' )`,
    (err, result) => {
      if (err) {
        const errorMessage = `Error inserting data: ${err}`;
        console.log(errorMessage);
        const currentDate = new Date().toLocaleString();
        const logData = `${errorMessage}`;
        const date = `${currentDate}`
        db.query(
          `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`, (error, Result) => {
            if (error) {
              res.send(error)
            } else {
              res.send(Result)
            }
          }
        );
        res.status(500).send('Error inserting data');
      } else {
        console.log(result);
        res.status(200).send('Data inserted successfully');
      }
    }
  );
});



server.post('/Department_post', (req, res) => {

  const { Divisonid, departmentname, status, createdBy } = req.body

  const reg = /[^'"\\]+/g;
  var value = departmentname.replace(reg, departmentname);

  console.log(Divisonid, departmentname, status, createdBy);

  db.query(
    `INSERT INTO attendance.dbo.departmentmaster(divisionid,departmentname,status,createdby) VALUES ('${Divisonid}', '${value}' , '${status}' ,'${createdBy}' )`,
    (err, result) => {
      if (err) {
        const errorMessage = `Error inserting data: ${err}`;
        console.log(errorMessage);
        const currentDate = new Date().toLocaleString();
        const logData = `${errorMessage}`;
        const date = `${currentDate}`
        db.query(
          `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
          (error, Result) => {
            if (error) {
              res.send(error)
            } else {
              res.send(Result)
            }
          }
        );
        res.status(500).send('Error inserting data');
      } else {
        console.log(result);
        res.status(200).send('Data inserted successfully');
      }
    }
  );
});


server.post('/Desgination_post', (req, res) => {

  const { departmentid, designationname, status, createdBy } = req.body

  const reg = /[^'"\\]+/g;
  var value = designationname.replace(reg, designationname);


  console.log(departmentid, designationname, status, createdBy);

  db.query(
    `INSERT INTO attendance.dbo.designationmaster(departmentid,designationname,status,createdby) 
    VALUES ('${departmentid}','${value}','${status}','${createdBy}')`,
    (err, result) => {
      if (err) {
        const errorMessage = `Error inserting data: ${err}`;
        console.log(errorMessage);
        const currentDate = new Date().toLocaleString();
        const logData = `${errorMessage}`;
        const date = `${currentDate}`
        db.query(
          `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
          [logData, date],
          (error, Result) => {
            if (error) {
              res.send(error)
            } else {
              res.send(Result)
            }
          }
        );
        res.status(500).send('Error inserting data');
      } else {
        console.log(result);
        res.status(200).send('Data inserted successfully');
      }
    }
  );
});

server.post('/employee_post', (req, res) => {

  const { empolyeecode, empolyeename, dateofbirth, dateofjoin, referenceno, status, companyid, branchid, divisonid, departmentid, designationid, createdBy,
    images,
  } = req.body


  db.query(
    `INSERT INTO attendance.dbo.empoloyeemaster(empoloyeecode, employeename, dateofbirth, dateofjoining, referenceno, status, companyid, branchid, divisionid, departmentid, designationid,createdby,photo) 
    VALUES ('${empolyeecode}','${empolyeename}','${dateofbirth}','${dateofjoin}','${referenceno}','${status}','${companyid}','${branchid}','${divisonid}','${departmentid}','${designationid}','${createdBy}','${images}')`,
    (err, result) => {
      if (err) {
        const errorMessage = `Error inserting from Employee Master Page: ${err}`;
        console.log(errorMessage);
        const currentDate = new Date().toLocaleString();
        const logData = `${errorMessage}`;
        const date = `${currentDate}`
        db.query(
          `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
          [logData, date],
          (error, Result) => {
            if (error) {
              res.send(error)
            } else {
              res.send(Result)
            }
          }
        );
        console.log(err);
        res.status(500).send('Error inserting data');
      } else {
        console.log(result);
        res.status(200).send('Data inserted successfully');
      }
    }
  );
});


server.post('/enquiry_insert', (req, res) => {
  const status = 'P';
  const responseid = '2';
  const { username, email, phoneno, remarks, createdby } = req.body
  const reg = /[^'"\\]+/g;
  var value = remarks.replace(reg, remarks);

  db.query(`INSERT INTO attendance.dbo.enquiry (CustomerName,Emailid,MobileNo,Remarks,Createdby,Status,Responseid) 
  VALUES('${username}','${email}',${phoneno},'${value}','${createdby}','${status}','${responseid}')`,
    (err, result) => {
      if (err) {
        console.log(err, "enquiry_insert");

        const errorMessage = `Error inserting data: ${err}`;
        const currentDate = new Date().toLocaleString();
        const logData = `${errorMessage}\n`;
        const date = `${currentDate}`
        db.query(
          `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
          (error, Result) => {
            if (error) {
              res.send(error)
            } else {
              res.send(Result)
            }
          }
        );
        res.status(500).send('Error inserting data');
      }
      else {
        console.log(result);
        res.send(result.recordset)
      }
    })
})


server.post('/typeofpack_insert', (req, res) => {
  const { value, amount, gst, createdBy } = req.body;
  const status = 'a'
  const query = `INSERT INTO attendance.dbo.packmaster (TypeofPack, Amount, Gst, Createdby, delstatus) 
  VALUES ('${value}', '${amount}', '${gst}', '${createdBy}','${status}')`;
  db.query(query, (err, result) => {
    if (err) {
      const errorMessage = `Error inserting data: ${err}`;
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            res.send(error)
          } else {
            res.send(Result)
          }
        }
      );
      res.status(500).send('Error inserting data');
    } else {
      res.send(result);
      console.log(result)
    }
  });
});


server.post('/transaction_insert', (req, res) => {

  const status = 'a'
  const { Employeecode, CustomerName, MobileNo, TypeofPack, Amount, Discount, Gst, TotalAmount, createdBy, Validityfrom, Validityto } = req.body
  const query = `INSERT INTO attendance.dbo.transactionhistory(Employeecode,CustomerName,MobileNo,TypeofPack,Amount,Discount,Gst,TotalAmount,Createdby,Validityfrom,Validityto,delstatus) 
  VALUES('${Employeecode}','${CustomerName}','${MobileNo}','${TypeofPack}','${Amount}','${Discount}','${Gst}',
  '${TotalAmount}','${createdBy}','${Validityfrom}','${Validityto}','${status}')`

  db.query(query, (err, result) => {
    if (err) {
      const errorMessage = `Error inserting data: ${err}`;
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            res.send(error)
          } else {
            res.send(Result)
          }
        }
      );
      res.status(500).send('Error inserting data');
    }
    else {
      res.send(result)
    }
  })

})

server.post('/CompanyProfile_post', (req, res) => {

  const status = 'a'
  const { Companyname, Address1, Address, Pincode, State, District, CompanyPhoto, createdBy } = req.body

  const reg = /[^'"\\]+/g;
  var CompanynameReg = Companyname.replace(reg, Companyname);
  var Address1Reg = Address1.replace(reg, Address1);
  var AddressReg = Address.replace(reg, Address);
  var StateReg = State.replace(reg, State);
  var DistrictReg = District.replace(reg, District);
  const query = `INSERT INTO attendance.dbo.companyprofileinfo(Companyname,Address1,Address,Pincode,State,District,CompanyPhoto,Createdby,delstatus)
   VALUES('${CompanynameReg}','${Address1Reg}','${AddressReg}','${Pincode}','${StateReg}','${DistrictReg}','${CompanyPhoto}','${createdBy}','${status}')`

  db.query(query, (err, result) => {
    if (err) {
      const errorMessage = `Error inserting data: ${err}`;
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            res.send(error)
          } else {
            res.send(Result)
          }
        }
      );
      res.status(500).send('Error inserting data');
    }
    else {
      res.send(result)
    }
  })
})
// Update query

server.put('/updatecompanydata/:id', (req, res) => {
  const id = req.params.id
  const date = new Date().toLocaleString();
  const { company_name, status, createdBy } = req.body

  const reg = /[^'"\\]+/g;
  var CompanynameReg = company_name.replace(reg, company_name);

  db.query(`UPDATE attendance.dbo.companymaster SET companyname = '${CompanynameReg}' , status = '${status}' , updatedate = '${date}', createdby = '${createdBy}' where companyid = ${id}`,
    (err, result) => {
      if (err) {
        const errorMessage = `Error update data from updatecompanydata: ${err}`;
        const currentDate = new Date().toLocaleString();
        const logData = `${errorMessage}\n`;
        const date = `${currentDate}`
        db.query(
          `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
          (error, Result) => {
            if (error) {
              res.send(error)
            } else {
              res.send(Result)
            }
          }
        );
        res.status(500).send('Error inserting data');
      }
      else {
        console.log(result);
        res.send(result)
      }
    })
})

server.put('/updatebranchdata/:id', (req, res) => {
  const id = req.params.id
  const date = new Date().toLocaleString();
  const { branch_name, status, companyid, createdBy } = req.body

  const reg = /[^'"\\]+/g;
  var RegValue = branch_name.replace(reg, branch_name);

  db.query(`UPDATE attendance.dbo.branchmaster SET companyid = ${companyid}, branchname = '${RegValue}' , status = '${status}' , updatedate = '${date}' , createdby = '${createdBy}' where branchid = ${id}`,
    (err, result) => {
      if (err) {
        const errorMessage = `Error Update data from updatebranchdata: ${err}`;
        const currentDate = new Date().toLocaleString();
        const logData = `${errorMessage}\n`;
        const date = `${currentDate}`
        db.query(
          `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
          (error, Result) => {
            if (error) {
              res.send(error)
            } else {
              res.send(Result)
            }
          }
        );
        res.status(500).send('Error Update data');
      }
      else {
        console.log(result);
        res.send(result)
      }
    })
})


server.put('/updatedivisondata/:id', (req, res) => {
  const id = req.params.id
  const date = new Date().toLocaleString();
  const { divisionname, status, branchid, createdBy } = req.body

  const reg = /[^'"\\]+/g;
  var RegValue = divisionname.replace(reg, divisionname);

  db.query(`UPDATE attendance.dbo.divisionmaster SET branchid = ${branchid}, divisionname = '${RegValue}' , status = '${status}' , updatedate = '${date}', createdby = '${createdBy}' where divisionid = ${id}`,
    (err, result) => {
      if (err) {
        const errorMessage = `Error Update data from updatedivisondata: ${err}`;
        const currentDate = new Date().toLocaleString();
        const logData = `${errorMessage}\n`;
        const date = `${currentDate}`
        db.query(
          `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
          (error, Result) => {
            if (error) {
              res.send(error)
            } else {
              res.send(Result)
            }
          }
        );
        res.status(500).send('Error Update data');
      }
      else {
        console.log(result);
        res.send(result)
      }
    })
})


server.put('/updatedepartmentdata/:id', (req, res) => {
  const id = req.params.id
  const date = new Date().toLocaleString();
  const { departmentname, status, divisionid, createdBy } = req.body

  const reg = /[^'"\\]+/g;
  var RegValue = departmentname.replace(reg, departmentname);

  db.query(`UPDATE attendance.dbo.departmentmaster SET divisionid = '${divisionid}', departmentname = '${RegValue}' , status = '${status}', updatedate = '${date}', createdby = '${createdBy}' where departmentid = ${id}`, (err, result) => {
    if (err) {
      const errorMessage = `Error Updating data Desgination : ${err}`;
      console.log(errorMessage);
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            console.error(error);
            res.send(error)
          }
          else{
            res.send(Result)
          }
        }
      );
      res.status(500).send('Error inserting data');
    }
    else {
      console.log(result);
      res.send(result)
    }
  })
})



server.put('/updatedesginationdata/:id', (req, res) => {
  const id = req.params.id
  const date = new Date().toLocaleString();
  const { designationname, status, departmentid, createdBy } = req.body

  const reg = /[^'"\\]+/g;
  var RegValue = designationname.replace(reg, designationname);

  db.query(`UPDATE attendance.dbo.designationmaster SET departmentid = '${departmentid}', designationname = '${RegValue}', status = '${status}', updatedate = '${date}', createdby = '${createdBy}' WHERE designationid = ${id}`, (err, result) => {
    if (err) {
      const errorMessage = `Error Updating data Desgination : ${err}`;
      console.log(errorMessage);
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
         if (error) {
            console.error(error);
            res.send(error)
          }
          else{
            res.send(Result)
          }
        }
      );
      res.status(500).send('Error inserting data');
    }
    else {
      console.log(result);
      res.send(result)
    }
  })
})



server.put('/updateemployeedata/:id', (req, res) => {
  const id = req.params.id;
  const {
    employeecode,
    employeename,
    dateofbirth,
    dateofjoin,
    referenceno,
    status,
    companyid,
    branchid,
    divisonid,
    departmentid,
    designationid,
    createdBy,
    images
  } = req.body;

  let updateQuery = `UPDATE attendance.dbo.empoloyeemaster SET empoloyeecode = '${employeecode}',employeename = '${employeename}',dateofbirth = '${dateofbirth}',dateofjoining = '${dateofjoin}',
referenceno = '${referenceno}',status = '${status}',companyid = '${companyid}',branchid = ${branchid},divisionid = ${divisonid},departmentid = ${departmentid},designationid = ${designationid},createdby = '${createdBy}'`;

  if (images !== undefined && images !== null && images !== '') {
    updateQuery += `, photo = '${images}'`;
  }
  updateQuery += ` WHERE employeeid = ${id}`;

  db.query(updateQuery, (err, result) => {
    if (err) {
      const errorMessage = `Error inserting data: ${err}`;
      console.log(errorMessage);
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            res.send(error)
          } else {
            res.send(Result)
          }
        }
      );
      res.status(500).send('Error updating data');
    } else {
      console.log(result);
      res.send(result);
    }
  });
});


server.put('/updateenquirydata/:id', (req, res) => {
  const id = req.params.id
  console.log(id);
  const { username, email, phoneno, remarks, createdBy } = req.body
  db.query(`UPDATE attendance.dbo.enquiry SET CustomerName = '${username}', Emailid = '${email}', MobileNo = '${phoneno}', Remarks = '${remarks}', createdby = '${createdBy}' WHERE Enquiryid = ${id}`, (err, result) => {
    if (err) {
      const errorMessage = `Error inserting data: ${err}`;
      console.log(errorMessage);
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            res.send(error)
          } else {
            res.send(Result)
          }
        }
      );
      res.status(500).send('Error inserting data');
    }
    else {
      console.log(result);
      res.send(result)
    }
  })
})

server.put('/enquire-assign/:id', async (req, res) => {
  const id = req.params.id;
  const { createdBy, assignvale } = req.body;
  const {
    empolyeecode,
    empolyeename,
    dateofbirth,
    dateofjoin,
    referenceno,
    status,
    companyid,
    branchid,
    divisonid,
    departmentid,
    designationid,
    images,
  } = req.body;

  const updateQuery = `
    UPDATE attendance.dbo.enquiry 
    SET Createdby = '${createdBy}', AssignedUser = '${assignvale}' 
    WHERE Enquiryid = '${id}'`;

  const insertQuery = `
    INSERT INTO attendance.dbo.empoloyeemaster (
      empoloyeecode, employeename, dateofbirth, dateofjoining, 
      referenceno, status, companyid, branchid, divisionid, 
      departmentid, designationid, createdby, photo
    ) 
    VALUES (
      '${empolyeecode}', '${empolyeename}', '${dateofbirth}', '${dateofjoin}', 
      '${referenceno}', '${status}', '${companyid}', '${branchid}', '${divisonid}', 
      '${departmentid}', '${designationid}', '${createdBy}', '${images}'
    )`;

  try {
    // Execute both queries in parallel
    await Promise.all([
      db.query(updateQuery, (err, result) => {
        if (err) {
          const errorMessage = `Error inserting data: ${err}`;
          console.log(errorMessage);
          const currentDate = new Date().toLocaleString();
          const logData = `${errorMessage}\n`;
          const date = `${currentDate}`
          db.query(
            `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
            (error, Result) => {
              if (error) {
                res.send(error)
              } else {
                res.send(Result)
              }
            }
          );
        }
      }),
      db.query(insertQuery, (err, result) => {
        const errorMessage = `Error inserting data: ${err}`;
        console.log(errorMessage);
        const currentDate = new Date().toLocaleString();
        const logData = `${errorMessage}\n`;
        const date = `${currentDate}`
        db.query(
          `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
          (error, Result) => {
            if (error) {
              res.send(error)
            } else {
              res.send(Result)
            }
          }
        );
      }),
    ]);

    console.log('Queries completed successfully.');
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating/enrolling');
  }
});

server.post('/updatefollowuppage', async (req, res) => {
  const { id, name, phoneno, datetime, remarks, mode } = req.body;
  try {
    if (datetime === '') {
      const value = {
        Status: "c",
        Responseid: "1"
      };

      await db.query(`UPDATE attendance.dbo.enquiry SET Status = '${value.Status}', Responseid = '${value.Responseid}' WHERE Enquiryid = ${id}`, (err, result) => {
        if (err) {
          const errorMessage = `Error Update data from updatefollowuppage: ${err}`;
          const currentDate = new Date().toLocaleString();
          const logData = `${errorMessage}\n`;
          const date = `${currentDate}`
          db.query(
            `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
            (error, Result) => {
              if (error) {
                res.send(error)
              } else {
                res.send(Result)
              }
            }
          );
          res.status(500).send('Error Update data');
        } else {
          console.log(result);
          res.status(200).json({ message: 'Enquiry updated' });
        }
      });
    } else {
      const value = {
        Status: "P",
        Responseid: "2"
      };

      await db.query(`UPDATE attendance.dbo.enquiry SET Status = '${value.Status}', Responseid = '${value.Responseid}' WHERE Enquiryid = ${id}`, async (err, result) => {
        if (err) {
          const errorMessage = `Error Update data from updatefollowuppage: ${err}`;
          const currentDate = new Date().toLocaleString();
          const logData = `${errorMessage}\n`;
          const date = `${currentDate}`
          db.query(
            `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
            (error, Result) => {
              if (error) {
                res.send(error)
              } else {
                res.send(Result)
              }
            }
          );
          res.status(500).send('Error Update data');
        } else {
          try {
            await db.query(`INSERT INTO attendance.dbo.courtesycallhistory (CustomerName, MobileNo, CallStataus, Status, Responseid, Callbackdatetime, Remarks) VALUES ('${name}', '${phoneno}', '${mode}', '${value.Status}', '${value.Responseid}', '${datetime}', '${remarks}')`);
            res.status(200).json({ message: 'Enquiry updated and inserted into courtesy call history' });
          } catch (insertErr) {
            console.error(insertErr);
            res.status(500).json({ error: 'Error inserting into courtesy call history' });
          }
        }
      });
    }
  } catch (err) {
    console.error(err);
    const errorMessage = `Error Update data from updatefollowuppage: ${err}`;
    const currentDate = new Date().toLocaleString();
    const logData = `${errorMessage}\n`;
    const date = `${currentDate}`
    db.query(
      `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
      (error, Result) => {
        if (error) {
          res.send(error)
        } else {
          res.send(Result)
        }
      }
    );
    res.status(500).send('Error Update data');

    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

server.put('/typeofpack_update/:id', (req, res) => {
  const id = req.params.id
  const { count, amount, gst, createdBy } = req.body
  db.query(`UPDATE attendance.dbo.packmaster SET TypeofPack = '${count}', Amount = '${amount}', Gst = '${gst}', createdby = '${createdBy}' WHERE packid = ${id}`, (err, result) => {
    if (err) {
      const errorMessage = `Error inserting data: ${err}`;
      console.log(errorMessage);
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        'INSERT INTO gym_main.err_log(error_logs, date) VALUES (?, ?)',
        [logData, date],
        (error, Result) => {
          if (error) {
            res.send(error)
          } else {
            res.send(Result)
          }
        }
      );
      res.status(500).send('Error inserting data');
    }
    else {
      console.log(result);
      res.send(result.recordset)
    }
  })
})

server.put('/updatecompanyprofile/:id', (req, res) => {
  const id = req.params.id;
  const { Companyname, Address1, Address, Pincode, State, District, CompanyPhoto, createdBy } = req.body;

  const reg = /[^'"\\]+/g;
  var CompanynameReg = Companyname.replace(reg, Companyname);
  var Address1Reg = Address1.replace(reg, Address1);
  var AddressReg = Address.replace(reg, Address);
  var StateReg = State.replace(reg, State);
  var DistrictReg = District.replace(reg, District);

  let updateQuery = `UPDATE attendance.dbo.companyprofileinfo SET Companyname = '${CompanynameReg}',Address1 = '${Address1Reg}',
  Address = '${AddressReg}',Pincode = '${Pincode}',State = '${StateReg}',District = '${DistrictReg}',Createdby = '${createdBy}'`;
  // Check if CompanyPhoto is not empty, then include it in the update query
  if (CompanyPhoto !== undefined && CompanyPhoto !== null && CompanyPhoto !== '') {
    updateQuery += `, CompanyPhoto = '${CompanyPhoto}'`;
  }

  updateQuery += ` WHERE Compinfoid = ${id}`;

  db.query(updateQuery, (err, result) => {
    if (err) {
      const errorMessage = `Error inserting data: ${err}`;
      console.log(errorMessage);
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            res.send(error)
          } else {
            res.send(Result)
          }
        }
      );
      res.status(500).send('Error updating data');
    } else {
      console.log(result);
      res.send(result);
    }
  });
})

// Delete Query

server.delete('/delete_companymaster', (req, res) => {
  const id = req.body.id
  const createdBy = req.body.createdBy
  const value = "InActive"
  db.query(`UPDATE attendance.dbo.companymaster SET Status = '${value}' , createdby = '${createdBy}'  where companyid = ${id}`, (err, response) => {
    if (err) {
      const errorMessage = `Error delete data from delete_companymaster: ${err}`;
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            console.error(error);
          }
        }
      );
      res.status(500).send('Error delete data');
    }
    else {
      console.log(response);
      res.send(response)
    }
  })
})
server.delete('/delete_branchmaster', (req, res) => {
  const id = req.body.id
  const createdBy = req.body.createdBy
  const value = "InActive"
  db.query(`UPDATE attendance.dbo.branchmaster SET Status = '${value}' , createdby = '${createdBy}' where branchid = ${id}`, (err, response) => {
    if (err) {
      const errorMessage = `Error delete data from delete_branchmaster: ${err}`;
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            console.error(error);
          }
        }
      );
      res.status(500).send('Error delete data');
    }
    else {
      console.log(response);
      res.send(response)
    }
  })
})
server.delete('/delete_divisonmaster', (req, res) => {
  const id = req.body.id
  const createdBy = req.body.createdBy
  const value = "InActive"
  db.query(`UPDATE attendance.dbo.divisionmaster SET status = '${value}' , createdby = '${createdBy}' where divisionid = ${id}`, (err, response) => {
    if (err) {
      const errorMessage = `Error delete data from delete_divisonmaster: ${err}`;
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            console.error(error);
          }
        }
      );
      res.status(500).send('Error delete data');
    }
    else {
      console.log(response);
      res.send(response)
    }
  })
})

server.delete('/delete_departmentnmaster', (req, res) => {
  const id = req.body.id
  const createdBy = req.body.createdBy
  const value = "InActive"
  db.query(`UPDATE attendance.dbo.departmentmaster SET status = '${value}' , createdby = '${createdBy}' where departmentid = ${id}`, (err, response) => {
    if (err) {
      const errorMessage = `Error delete data from delete_departmentnmaster: ${err}`;
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            console.error(error);
          }
        }
      );
      res.status(500).send('Error delete data');
    }
    else {
      console.log(response);
      res.send(response)
    }
  })
})
server.delete('/delete_designationmaster', (req, res) => {
  const id = req.body.id
  const createdBy = req.body.createdBy
  const value = "InActive"
  db.query(`UPDATE attendance.dbo.designationmaster SET status = '${value}' , createdby = '${createdBy}' where designationid = ${id}`, (err, response) => {
    if (err) {
      const errorMessage = `Error delete data from delete_designationmaster: ${err}`;
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            console.error(error);
          }
        }
      );
      res.status(500).send('Error delete data');
    }
    else {
      console.log(response);
      res.send(response)
    }
  })
})

server.delete('/delete_employeemaster', (req, res) => {
  const id = req.body.id
  const createdBy = req.body.createdBy
  const value = "InActive"
  db.query(`UPDATE attendance.dbo.empoloyeemaster SET status = '${value}' , createdby = '${createdBy}' where employeeid = ${id}`, (err, response) => {
    if (err) {
      const errorMessage = `Error delete data from delete_employeemaster: ${err}`;
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            console.error(error);
          }
        }
      );
      res.status(500).send('Error delete data');
    }
    else {
      console.log(response);
      res.send(response)
    }
  })
})

server.delete('/delete_packmaster', (req, res) => {
  const id = req.body.id
  const value = "i"
  db.query(`UPDATE attendance.dbo.packmaster SET delstatus = '${value}' where packid = ${id}`, (err, response) => {
    if (err) {
      const errorMessage = `Error delete data from delete_packmaster: ${err}`;
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            console.error(error);
          }
        }
      );
      res.status(500).send('Error delete data');
    }
    else {
      console.log(response);
      res.send(response)
    }
  })
})


server.delete('/delete_companyprofile', (req, res) => {
  const id = req.body.id
  const value = "i"
  db.query(`UPDATE attendance.dbo.companyprofileinfo SET delstatus = '${value}' where Compinfoid = ${id}`, (err, response) => {
    if (err) {
      const errorMessage = `Error delete data from delete_Companyprofile: ${err}`;
      const currentDate = new Date().toLocaleString();
      const logData = `${errorMessage}\n`;
      const date = `${currentDate}`
      db.query(
        `INSERT INTO attendance.dbo.err_log(error_logs, date) VALUES ('${logData}', '${date}')`,
        (error, Result) => {
          if (error) {
            console.error(error);
          }
        }
      );
      res.status(500).send('Error delete data');
    }
    else {
      console.log(response);
      res.send(response)
    }
  })
})

// Edit Query

server.get('/editcompany_data/:id', (req, res) => {
  const id = req.params.id
  db.query(`SELECT * FROM attendance.dbo.companymaster where companyid  = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/editbranch_data/:id', (req, res) => {
  const id = req.params.id
  db.query(`SELECT * FROM attendance.dbo.branchmaster where branchid  = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/editdivison_data/:id', (req, res) => {
  const id = req.params.id
  db.query(`SELECT * FROM attendance.dbo.divisionmaster where divisionid  = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/editdepartment_data/:id', (req, res) => {
  const id = req.params.id
  db.query(`SELECT * FROM attendance.dbo.departmentmaster where departmentid  = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/editdesignation_data/:id', (req, res) => {
  const id = req.params.id
  db.query(`SELECT * FROM attendance.dbo.designationmaster where designationid  = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/editemployee_data/:id', (req, res) => {
  const id = req.params.id
  db.query(`SELECT * FROM attendance.dbo.empoloyeemaster where employeeid  = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/editenquiry_data/:id', (req, res) => {
  const id = req.params.id
  db.query(`SELECT * FROM attendance.dbo.enquiry where Enquiryid  = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/edittypeofpack_data/:id', (req, res) => {
  const id = req.params.id
  db.query(`SELECT * FROM attendance.dbo.packmaster where packid  = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
})

server.get('/editcompanyprofile_data/:id', (req, res) => {
  const id = req.params.id
  db.query(`SELECT * FROM attendance.dbo.companyprofileinfo where Compinfoid  = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});
// DropDown Quers

server.get('/drop-down', (req, res) => {
  db.query('SELECT * FROM attendance.dbo.companymaster', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/drop-down-branch', (req, res) => {
  db.query('SELECT * FROM attendance.dbo.branchmaster', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});


server.get('/drop-down-divison', (req, res) => {
  db.query('SELECT * FROM attendance.dbo.divisionmaster', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/drop-down-department', (req, res) => {
  db.query('SELECT * FROM attendance.dbo.departmentmaster;', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/drop-down-designation', (req, res) => {
  db.query('SELECT * FROM attendance.dbo.designationmaster;', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/drop-down-branchid/:value', (req, res) => {
  const id = req.params.value;
  const value = 'Active'
  db.query(`SELECT branchname,branchid FROM attendance.dbo.branchmaster WHERE companyid = ${id} and status = '${value}'`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/drop-down-divisonid/:value', (req, res) => {
  const id = req.params.value;
  const value = 'Active'
  db.query(`SELECT divisionname,divisionid FROM attendance.dbo.divisionmaster where branchid = ${id} and status = '${value}'`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});
server.get('/drop-down-departmentid/:value', (req, res) => {
  const id = req.params.value;
  const value = 'Active'
  db.query(`SELECT departmentname,departmentid FROM attendance.dbo.departmentmaster where divisionid = ${id} and status = '${value}'`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});

server.get('/drop-down-designation/:value', (req, res) => {
  const id = req.params.value;
  const value = 'Active'
  db.query(`SELECT designationname,designationid FROM attendance.dbo.designationmaster where departmentid = ${id} and status = '${value}'`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data');
    } else {
      console.log('success');
      res.send(result.recordset);
    }
  });
});


// Upload Query 


let successfulUploads = 0;

server.post('/upload-data', upload.single('file'), async (req, res) => {

  const createdBy = req.body.createdBy

  try {
    await new Promise((resolve, reject) => {
      db.query(`TRUNCATE TABLE attendance.dbo.importdatatemp`, (truncateErr, truncateResult) => {
        if (truncateErr) {
          reject(truncateErr);
          console.log(truncateErr);
        } else {
          resolve(truncateResult);
        }
      });
    });


    if (!req.file) {
      return res.status(400).send('No files were uploaded.');
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const excelData = XLSX.utils.sheet_to_json(worksheet);

    const insertQueries = [];

    excelData.forEach((data) => {
      const {
        empoloyeecode,
        employeename,
        // dateofbirth,
        // dateofjoining,
        referenceno,
        status,
        companyname,
        branchname,
        divisionname,
        departmentname,
        designationname,
        createdby,

      } = data;

      const trimString = (value) => {
        return typeof value === 'string' ? value.trim() : value;
      };

      const trimmedEmpoloyeecode = trimString(empoloyeecode);
      const trimmedEmployeename = trimString(employeename);

      const query = `INSERT INTO attendance.dbo.importdatatemp(empoloyeecode, employeename,referenceno, status, companyname, branchname, divisionname, departmentname, designationname, createdby) 
      VALUES ('${trimmedEmpoloyeecode}','${trimmedEmployeename}','${referenceno}' ,'${status}','${companyname}','${branchname}','${divisionname}','${departmentname}', 
      '${designationname}','${createdby}')`;

      insertQueries.push({ query });
    });

    const selectPromises = excelData.map((data) => {
      const empoloyeecode = data.empoloyeecode;
      const employeename = data.employeename
      // const dateofbirth = data.dateofbirth
      // const dateofjoining = data.dateofjoining
      const referenceno = data.referenceno
      const status = data.status
      // const createdate = data.createdate
      const companyname = data.companyname;
      const branchname = data.branchname;
      const divisionname = data.divisionname;
      const departmentname = data.departmentname;
      const designationname = data.designationname;

      const defaultImage = getDefaultImageBase64();
      return new Promise((resolve, reject) => {
        let companyIds = {};
        db.query(`SELECT companyid FROM attendance.dbo.companymaster with(nolock) WHERE companyname = '${companyname}'`, (err, companyIdResult) => {
          if (err) {
            reject(err);
            console.log(err);
          } else {
            companyIds.companyId = companyIdResult.recordset[0]?.companyid;
            db.query(`SELECT branchid FROM attendance.dbo.branchmaster with(nolock) WHERE branchname = '${branchname}'`, (err, branchIdResult) => {
              if (err) {
                reject(err);
                console.log(err);
              } else {
                companyIds.branchId = branchIdResult.recordset[0]?.branchid;
                db.query(`SELECT divisionid FROM attendance.dbo.divisionmaster with(nolock)  WHERE divisionname = '${divisionname}'`, (err, divisionIdResult) => {
                  if (err) {
                    reject(err);
                    console.log(err);
                  } else {
                    companyIds.divisionId = divisionIdResult.recordset[0]?.divisionid;
                    db.query(`SELECT departmentid FROM attendance.dbo.departmentmaster with(nolock) WHERE departmentname = '${departmentname}'`, (err, departmentIdResult) => {
                      if (err) {
                        reject(err);
                        console.log(err);
                      } else {
                        companyIds.departmentId = departmentIdResult.recordset[0]?.departmentid;
                        db.query(`SELECT designationid FROM attendance.dbo.designationmaster with(nolock) WHERE designationname = '${designationname}'`, (err, designationIdResult) => {
                          if (err) {
                            reject(err);
                            console.log(err);
                          } else {
                            companyIds.designationId = designationIdResult.recordset[0]?.designationid;
                            const {
                              companyId,
                              branchId,
                              divisionId,
                              departmentId,
                              designationId
                            } = companyIds;
                            // const companyId = companyIds.companyId || 0;
                            // const branchId = companyIds.companyId || 0;
                            // const divisionId = companyIds.companyId || 0;
                            // const departmentId = companyIds.companyId || 0;
                            // const designationId = companyIds.companyId || 0;

                            const insertQuery = `INSERT INTO attendance.dbo.empoloyeemaster (empoloyeecode, employeename,referenceno, status, companyid, branchid, divisionid, departmentid, designationid,createdby, photo) 
                          VALUES ('${empoloyeecode}', '${employeename}', '${referenceno}', '${status}', '${companyId}', '${branchId}', '${divisionId}', '${departmentId}', '${designationId}','${createdBy}','${defaultImage}')`;

                            db.query(insertQuery, (insertErr, insertResult) => {
                              if (insertErr) {
                                reject(insertErr);
                                console.log(insertErr);
                              } else {
                                resolve(insertResult);
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });

      });
    });
    await Promise.all(selectPromises)
      .then(async (companyIds) => {
        const insertPromises = insertQueries.map(({ query }) => {
          return new Promise((resolve, reject) => {
            db.query(query, (error, results, fields) => {
              if (error) {
                reject(error);
                console.log(error, "initial insert error");
              } else {
                console.log("Uploaded data successfully");
                resolve(results);

              }
            });
          });
        });

        return Promise.all(insertPromises)
          .then((insertResults) => {
            successfulUploads += insertResults.length;
            console.log(successfulUploads);
            return successfulUploads;
          });
      })
    res.json({
      message: 'File uploaded and data stored successfully',
      successfulUploads: successfulUploads
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading or fetching data');
  }
});



server.listen(PORT, () => {
  console.log(`Server is connected ${PORT}`);
});



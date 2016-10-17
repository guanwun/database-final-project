--Users can choose to use their Google/Facebook account

CREATE TABLE Users(
  userName VARCHAR(20) NOT NULL PRIMARY KEY,
  userPhone VARCHAR(15),
  age INTEGER
);

CREATE TABLE Drugs(
  drugID VARCHAR(7) NOT NULL PRIMARY KEY,
  drugName VARCHAR(50) NOT NULL UNIQUE,
  drugDescription character varying(5000),
  toxicity character varying(7000)
);

CREATE TABLE Pharmacy(
  pharmacyID VARCHAR(15) NOT NULL PRIMARY KEY,
  pharmacyName VARCHAR(256) NOT NULL,
  pharmacyPhone VARCHAR(15) NOT NULL,
  address VARCHAR(256)
);

CREATE TABLE Prescription(
  prescriptionNumber VARCHAR(20) NOT NULL PRIMARY KEY,
  userName VARCHAR(20) NOT NULL REFERENCES Users(userName),
  drugID VARCHAR(7) NOT NULL REFERENCES Drugs(drugID),
  pharmacyID VARCHAR(15) NOT NULL REFERENCES Pharmacy(pharmacyID),
  dose VARCHAR(10) NOT NULL,
  time VARCHAR(256) NOT NULL,
  refillDate DATE,
  refillsLeft INTEGER
);

CREATE TABLE Interaction(
  drugName VARCHAR(50) NOT NULL REFERENCES Drugs(drugName),
  Interaction_drugName VARCHAR(50) NOT NULL REFERENCES Drugs(drugName),
  PRIMARY KEY(drugName, Interaction_drugName),
  interactionDescription character varying(5000)
);

CREATE TABLE DrugBrand(
  brandName VARCHAR(50) NOT NULL PRIMARY KEY,
  genericName VARCHAR(50) REFERENCES Drugs(drugName)
);
           
INSERT INTO Users
VALUES ('BobSmith123', '586-744-0877', '23');

SELECT * FROM Users;

UPDATE Users
SET userPhone = '984-904-3030'
WHERE userName = 'BobSmith123';

SELECT * FROM Users;

INSERT INTO Drugs
VALUES ('DB00001', 'Lepirudin', 'identical to natural hirudin', 'the risk of bleeding is increased');

SELECT * FROM Drugs;

INSERT INTO Drugs
VALUES ('DB00552', 'Caliby', 'identical to natural fever', 'the risk of coughing is increased');

SELECT * FROM Drugs;

INSERT INTO Drugs
VALUES ('DB00002', 'Lep', 'identical to hirudin', 'the risk of bleeding is decreased');

SELECT * FROM Drugs;

INSERT INTO Pharmacy
VALUES ('1234', 'Rite Aid Durham', '555-555-5555', '12345 Main Street');

SELECT * FROM Pharmacy;

INSERT INTO Prescription
VALUES ('1234-56789', 'BobSmith123', 'DB00001', '1234', '5mg', 'Everyday 09:00', '2015-10-15', '2');

SELECT * FROM Prescription;

UPDATE Prescription
SET dose = '10mg'
WHERE prescriptionNumber = '1234-56789';

SELECT * FROM Prescription;

INSERT INTO Interaction
VALUES ('Lepirudin', 'Caliby', 'May diminish the therapeutic effect of Choline C 11');

SELECT * FROM Interaction;

INSERT INTO DrugBrand

VALUES ('lepricon', 'Lepirudin');

INSERT INTO DrugBrand

VALUES ('lexico', 'Lepirudin');

SELECT * FROM DrugBrand;



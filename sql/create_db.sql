CREATE TABLE users (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       username VARCHAR(50) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       role ENUM('admin', 'parent') NOT NULL DEFAULT 'parent'
);


CREATE TABLE children (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          name VARCHAR(100) NOT NULL,
                          qr_code VARCHAR(255),
                          parent_id INT,
                          FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE locations (
                           id INT AUTO_INCREMENT PRIMARY KEY,
                           child_id INT,
                           latitude DECIMAL(9,6),
                           longitude DECIMAL(9,6),
                           timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                           FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);


CREATE TABLE alerts (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        child_id INT,
                        type VARCHAR(50),
                        message TEXT,
                        triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

<?php
$host = "localhost";
$username = "root";       // phpMyAdmin ka default user
$password = "";           // agar password set hai to wo likhein
$dbname = "employees_data";

$conn = new mysqli($host, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]));
}
?>
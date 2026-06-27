<?php
header('Content-Type: application/json');
include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

$fullname   = $conn->real_escape_string($data['fullname']);
$email      = $conn->real_escape_string($data['email']);
$role       = $conn->real_escape_string($data['role']);
$department = $conn->real_escape_string($data['department']);

$sql = "INSERT INTO employees (fullname, email, role, department) 
        VALUES ('$fullname', '$email', '$role', '$department')";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["status" => "success", "message" => "Employee added"]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}

$conn->close();
?>
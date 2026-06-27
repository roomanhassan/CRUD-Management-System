<?php
header('Content-Type: application/json');
include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

$id         = intval($data['id']);
$fullname   = $conn->real_escape_string($data['fullname']);
$email      = $conn->real_escape_string($data['email']);
$role       = $conn->real_escape_string($data['role']);
$department = $conn->real_escape_string($data['department']);

$sql = "UPDATE employees 
        SET fullname='$fullname', email='$email', role='$role', department='$department' 
        WHERE id=$id";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["status" => "success", "message" => "Employee updated"]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}

$conn->close();
?>
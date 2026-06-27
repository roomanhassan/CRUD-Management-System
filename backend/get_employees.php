<?php
header('Content-Type: application/json');
include 'db_connect.php';

$sql = "SELECT * FROM employees";
$result = $conn->query($sql);

$employees = [];
while ($row = $result->fetch_assoc()) {
    $employees[] = $row;
}

echo json_encode($employees);
$conn->close();
?>
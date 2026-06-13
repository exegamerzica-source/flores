<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function load_env_value(string $key): ?string
{
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }

    static $loaded = false;
    if (!$loaded) {
        $envPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
        if (is_readable($envPath)) {
            foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                    continue;
                }

                [$name, $rawValue] = explode('=', $line, 2);
                $name = trim($name);
                $rawValue = trim($rawValue);
                $rawValue = trim($rawValue, "\"'");

                if ($name !== '') {
                    putenv($name . '=' . $rawValue);
                    $_ENV[$name] = $rawValue;
                }
            }
        }
        $loaded = true;
    }

    $value = getenv($key);
    return ($value !== false && $value !== '') ? $value : null;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Envie um JSON valido no corpo da requisicao.',
        ]);
        exit;
    }

    return $data;
}

function blackcat_request(string $method, string $path, ?array $payload = null): void
{
    $apiKey = load_env_value('BLACKCATPAY_API_KEY');
    if (!$apiKey) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'BLACKCATPAY_API_KEY nao configurada.',
        ]);
        exit;
    }

    $ch = curl_init('https://api.blackcatpay.com.br/api' . $path);
    $headers = [
        'Content-Type: application/json',
        'X-API-Key: ' . $apiKey,
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
    ]);

    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    }

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($response === false || $error !== '') {
        http_response_code(502);
        echo json_encode([
            'success' => false,
            'message' => 'Falha ao comunicar com a Blackcat.',
            'error' => $error,
        ]);
        exit;
    }

    http_response_code($httpCode > 0 ? $httpCode : 200);
    echo $response;
    exit;
}

$action = $_GET['action'] ?? 'create-sale';

if ($action === 'status') {
    $transactionId = preg_replace('/[^A-Za-z0-9_-]/', '', $_GET['transactionId'] ?? '');
    if ($transactionId === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Informe transactionId para consultar o status.',
        ]);
        exit;
    }

    blackcat_request('GET', '/sales/' . $transactionId . '/status');
}

if ($action === 'seller') {
    blackcat_request('GET', '/sales/seller');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Use POST para criar uma venda.',
    ]);
    exit;
}

$sale = read_json_body();
$sale['currency'] = $sale['currency'] ?? 'BRL';
$sale['paymentMethod'] = 'pix';

blackcat_request('POST', '/sales/create-sale', $sale);

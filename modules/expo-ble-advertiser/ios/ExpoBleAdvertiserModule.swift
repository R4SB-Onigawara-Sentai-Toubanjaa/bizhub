import ExpoModulesCore
import CoreBluetooth

class BLEExchangeManager: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate, CBPeripheralManagerDelegate {
    var centralManager: CBCentralManager!
    var peripheralManager: CBPeripheralManager!
    
    private var isCentralReady = false
    private var isPeripheralReady = false
    
    private var activePromise: Promise?
    private var myToken: String?
    private var targetServiceUUID: CBUUID?
    private var discoveredPeripheral: CBPeripheral?
    private var isExchanged = false
    
    // 2つのキャラクタリスティック（Read用とWrite用）
    private let readCharUUID = CBUUID(string: "b1248ab6-374d-4530-8a4b-2f34800263f3")
    private let writeCharUUID = CBUUID(string: "b1248ab7-374d-4530-8a4b-2f34800263f3")

    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
        peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
    }

    func centralManagerDidUpdateState(_ central: CBCentralManager) { isCentralReady = (central.state == .poweredOn) }
    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) { isPeripheralReady = (peripheral.state == .poweredOn) }

    func startExchange(uuid: String, token: String, promise: Promise) {
        guard isCentralReady && isPeripheralReady else {
            promise.reject("ERR_BLE", "Bluetoothが準備できていません")
            return
        }
        cleanup()
        
        self.activePromise = promise
        self.myToken = token
        self.targetServiceUUID = CBUUID(string: uuid)
        self.isExchanged = false
        
        // --- 発信（GATTサーバー）の構築 ---
        let readChar = CBMutableCharacteristic(type: readCharUUID, properties: [.read], value: nil, permissions: [.readable])
        let writeChar = CBMutableCharacteristic(type: writeCharUUID, properties: [.write], value: nil, permissions: [.writeable])
        let service = CBMutableService(type: targetServiceUUID!, primary: true)
        service.characteristics = [readChar, writeChar]
        peripheralManager.add(service)
        peripheralManager.startAdvertising([CBAdvertisementDataServiceUUIDsKey: [targetServiceUUID!]])
        
        // --- 受信（スキャン）の開始 ---
        centralManager.scanForPeripherals(withServices: [targetServiceUUID!], options: [CBCentralManagerScanOptionAllowDuplicatesKey: true])
    }

    func stopExchange() {
        activePromise?.reject("ERR_CANCEL", "キャンセルされました")
        cleanup()
    }

    private func cleanup() {
        centralManager.stopScan()
        if let p = discoveredPeripheral { centralManager.cancelPeripheralConnection(p) }
        if peripheralManager.isAdvertising { peripheralManager.stopAdvertising() }
        peripheralManager.removeAllServices()
        activePromise = nil
        myToken = nil
        discoveredPeripheral = nil
    }

    private func finishExchange(peerToken: String) {
        guard !isExchanged else { return }
        isExchanged = true
        activePromise?.resolve(peerToken)
        cleanup() // 完了後直ちに電波を停止
    }

    // --- セントラル（受信側）ロジック ---
    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        // RSSIフィルタ（-60dBm以上の至近距離のみ接続）
        if RSSI.intValue < -60 { return }
        
        centralManager.stopScan()
        self.discoveredPeripheral = peripheral
        peripheral.delegate = self
        centralManager.connect(peripheral, options: nil)
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        peripheral.discoverServices([targetServiceUUID!])
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard let service = peripheral.services?.first else { return }
        peripheral.discoverCharacteristics([readCharUUID, writeCharUUID], for: service)
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        guard let chars = service.characteristics, let myData = myToken?.data(using: .utf8) else { return }
        
        // 相手のWriteに自分のトークンを書き込み、相手のReadからトークンを読み取る
        for char in chars {
            if char.uuid == writeCharUUID {
                peripheral.writeValue(myData, for: char, type: .withResponse)
            } else if char.uuid == readCharUUID {
                peripheral.readValue(for: char)
            }
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if characteristic.uuid == readCharUUID, let data = characteristic.value, let peerToken = String(data: data, encoding: .utf8) {
            finishExchange(peerToken: peerToken)
        }
    }

    // --- ペリフェラル（発信側）ロジック ---
    func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveRead request: CBATTRequest) {
        if request.characteristic.uuid == readCharUUID, let data = myToken?.data(using: .utf8) {
            request.value = data
            peripheralManager.respond(to: request, withResult: .success)
        } else {
            peripheralManager.respond(to: request, withResult: .attributeNotFound)
        }
    }

    func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveWrite requests: [CBATTRequest]) {
        for request in requests {
            if request.characteristic.uuid == writeCharUUID, let data = request.value, let peerToken = String(data: data, encoding: .utf8) {
                peripheralManager.respond(to: request, withResult: .success)
                finishExchange(peerToken: peerToken)
            }
        }
    }
}

public class ExpoBleAdvertiserModule: Module {
  private var exchangeManager: BLEExchangeManager?

  public func definition() -> ModuleDefinition {
    Name("ExpoBleAdvertiser")

    OnCreate {
      self.exchangeManager = BLEExchangeManager()
    }

    AsyncFunction("startExchange") { (uuid: String, token: String, promise: Promise) in
      self.exchangeManager?.startExchange(uuid: uuid, token: token, promise: promise)
    }

    AsyncFunction("stopExchange") { (promise: Promise) in
      self.exchangeManager?.stopExchange()
      promise.resolve(true)
    }
  }
}
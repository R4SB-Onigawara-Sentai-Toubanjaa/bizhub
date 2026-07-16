package expo.modules.bleadvertiser

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.ParcelUuid
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.util.UUID

@SuppressLint("MissingPermission")
class ExpoBleAdvertiserModule : Module() {
  private var advertiseCallback: AdvertiseCallback? = null
  private var gattServer: BluetoothGattServer? = null
  private var bluetoothGatt: BluetoothGatt? = null
  private var isScanning = false
  
  private var activePromise: Promise? = null
  private var myToken: String? = null
  private var isExchanged = false

  private val READ_CHAR_UUID = UUID.fromString("b1248ab6-374d-4530-8a4b-2f34800263f3")
  private val WRITE_CHAR_UUID = UUID.fromString("b1248ab7-374d-4530-8a4b-2f34800263f3")

  private val bluetoothManager: BluetoothManager?
    get() = appContext.reactContext?.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager

  private val bluetoothAdapter: BluetoothAdapter?
    get() = bluetoothManager?.adapter

  private fun finishExchange(peerToken: String) {
    if (isExchanged) return
    isExchanged = true
    activePromise?.resolve(peerToken)
    cleanup()
  }

  private fun cleanup() {
    val scanner = bluetoothAdapter?.bluetoothLeScanner
    if (isScanning && scanner != null) {
      try {
        scanner.stopScan(scanCallback)
      } catch (e: Exception) {}
      isScanning = false
    }
    
    if (advertiseCallback != null) {
      try {
        bluetoothAdapter?.bluetoothLeAdvertiser?.stopAdvertising(advertiseCallback)
      } catch (e: Exception) {}
      advertiseCallback = null
    }
    
    try {
      gattServer?.close()
    } catch (e: Exception) {}
    gattServer = null
    
    try {
      bluetoothGatt?.close()
    } catch (e: Exception) {}
    bluetoothGatt = null
    
    activePromise = null
    myToken = null
  }

  // --- ペリフェラル（発信側）ロジック ---
  private val gattServerCallback = object : BluetoothGattServerCallback() {
    override fun onCharacteristicReadRequest(device: BluetoothDevice?, requestId: Int, offset: Int, characteristic: BluetoothGattCharacteristic?) {
      if (characteristic?.uuid == READ_CHAR_UUID) {
        val value = myToken?.toByteArray(Charsets.UTF_8) ?: ByteArray(0)
        gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, value)
      }
    }
    override fun onCharacteristicWriteRequest(device: BluetoothDevice?, requestId: Int, characteristic: BluetoothGattCharacteristic?, preparedWrite: Boolean, responseNeeded: Boolean, offset: Int, value: ByteArray?) {
      if (characteristic?.uuid == WRITE_CHAR_UUID && value != null) {
        if (responseNeeded) gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
        val peerToken = String(value, Charsets.UTF_8)
        finishExchange(peerToken)
      }
    }
  }

  // --- セントラル（受信側）ロジック ---
  private val scanCallback = object : ScanCallback() {
    override fun onScanResult(callbackType: Int, result: ScanResult?) {
      // RSSIフィルタ（-60dBm以上の至近距離のみ接続）
      if (result == null || result.rssi < -60) return
      
      val device = result.device
      val scanner = bluetoothAdapter?.bluetoothLeScanner
      if (isScanning && scanner != null) {
        scanner.stopScan(this)
        isScanning = false
      }
      bluetoothGatt = device.connectGatt(appContext.reactContext, false, gattClientCallback)
    }
  }

  private val gattClientCallback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
      if (newState == BluetoothProfile.STATE_CONNECTED) gatt.discoverServices()
    }
    override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
      if (status == BluetoothGatt.GATT_SUCCESS) {
        for (service in gatt.services) {
          val writeChar = service.getCharacteristic(WRITE_CHAR_UUID)
          val readChar = service.getCharacteristic(READ_CHAR_UUID)
          
          if (writeChar != null && myToken != null) {
            writeChar.value = myToken!!.toByteArray(Charsets.UTF_8)
            writeChar.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
            gatt.writeCharacteristic(writeChar)
          }
          if (readChar != null) {
            gatt.readCharacteristic(readChar)
          }
        }
      }
    }
    override fun onCharacteristicRead(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
      if (status == BluetoothGatt.GATT_SUCCESS && characteristic.uuid == READ_CHAR_UUID) {
        val value = characteristic.value
        if (value != null) {
          val peerToken = String(value, Charsets.UTF_8)
          finishExchange(peerToken)
        }
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoBleAdvertiser")

    AsyncFunction("startExchange") { uuid: String, token: String, promise: Promise ->
      val adapter = bluetoothAdapter
      val manager = bluetoothManager
      val context = appContext.reactContext
      if (adapter == null || !adapter.isEnabled || manager == null || context == null) {
        promise.reject("ERR_BLE", "Bluetoothが無効です", null); return@AsyncFunction
      }
      cleanup()
      
      activePromise = promise
      myToken = token
      isExchanged = false

      // 発信開始
      gattServer = manager.openGattServer(context, gattServerCallback)
      val service = BluetoothGattService(UUID.fromString(uuid), BluetoothGattService.SERVICE_TYPE_PRIMARY)
      service.addCharacteristic(BluetoothGattCharacteristic(READ_CHAR_UUID, BluetoothGattCharacteristic.PROPERTY_READ, BluetoothGattCharacteristic.PERMISSION_READ))
      service.addCharacteristic(BluetoothGattCharacteristic(WRITE_CHAR_UUID, BluetoothGattCharacteristic.PROPERTY_WRITE, BluetoothGattCharacteristic.PERMISSION_WRITE))
      gattServer?.addService(service)

      val settings = AdvertiseSettings.Builder().setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY).setConnectable(true).build()
      val data = AdvertiseData.Builder().setIncludeDeviceName(false).addServiceUuid(ParcelUuid(UUID.fromString(uuid))).build()
      
      advertiseCallback = object : AdvertiseCallback() {}
      adapter.bluetoothLeAdvertiser?.startAdvertising(settings, data, advertiseCallback)

      // スキャン開始
      val scanner = adapter.bluetoothLeScanner
      if (scanner != null) {
        isScanning = true
        val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(UUID.fromString(uuid))).build()
        val scanSettings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
        scanner.startScan(listOf(filter), scanSettings, scanCallback)
      }
    }

    AsyncFunction("stopExchange") { promise: Promise ->
      activePromise?.reject("ERR_CANCEL", "キャンセルされました", null)
      cleanup()
      promise.resolve(true)
    }
  }
}
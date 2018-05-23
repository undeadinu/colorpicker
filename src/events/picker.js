'use strict'

const ioHook = require('iohook')
const {ipcMain} = require('electron')
const robot = require('robotjs')

let size, mouse, mouseEvent, color;

module.exports = (storage, browsers) => {
  const {picker, colorpicker} = browsers

  ioHook.start();

  ioHook.on('mousemove', event => {
    if(!picker.getWindow()) return
    let realtime = storage.get('realtime', 'picker')
    let {x, y} = event;
    let color = '#' + robot.getPixelColor(parseInt(x), parseInt(y))
    picker.getWindow().setPosition(parseInt(x) - 50, parseInt(y) - 50)
    picker.getWindow().webContents.send('updatePicker', color)
    if (realtime) colorpicker.getWindow().webContents.send('previewColor', color)
  })

  ioHook.on('mouseup', event => {
    console.log(event)
    if(!picker.getWindow()) return
    if(event.button == 2) return closePicker();
    let {x, y} = event;
    console.log(x, y)
    console.log(robot.getPixelColor(parseInt(x), parseInt(y)))
    closePicker('#' + robot.getPixelColor(parseInt(x), parseInt(y)))
  })

  let closePicker = newColor => {
    if (typeof newColor !== 'string') newColor = color
    if (picker.getWindow()) {
      picker.getWindow().close()
      colorpicker.getWindow().webContents.send('changeColor', newColor)
      colorpicker.getWindow().focus()
      ipcMain.removeListener('closePicker', closePicker)
      ipcMain.removeListener('pickerRequested', event => {})
    }
  }

  ipcMain.on('pickerRequested', event => {
    let realtime = storage.get('realtime', 'picker')

    color = storage.get('lastColor')
    picker.getWindow().on('close', () => mouseEvent.destroy())

    let pos = robot.getMousePos()
    picker.getWindow().setPosition(parseInt(pos.x) - 50, parseInt(pos.y) - 50)
    picker.getWindow().webContents.send('updatePicker', robot.getPixelColor(pos.x, pos.y))

    ipcMain.on('closePicker', closePicker)
  })
}

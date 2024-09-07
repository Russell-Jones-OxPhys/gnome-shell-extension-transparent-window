
//Clear the lock bit so the status of Caps_Lock won't affect the functionality
//~2(caps_lock) and ~16(num_lock)
function getMultiKeysCode(keymap) {
    return keymap.get_modifier_state() & (~(2 | 16));
}

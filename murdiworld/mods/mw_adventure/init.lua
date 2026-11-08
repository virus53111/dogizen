-- MURDIWORLD 0.2 · Crystal Guardian adventure
-- Original MIT-licensed Luanti mod. Runs in VoxeLibre, with no network calls.
local active = {}
local hud = {}
local QUEST_CRYSTALS = 5

local function message(p, msg)
    if p and p:is_player() then
        core.chat_send_player(p:get_player_name(), "[MURDIWORLD] " .. msg)
    end
end
local function phase(p)
    local m = p:get_meta()
    if m:get_int("mw_crystals") < QUEST_CRYSTALS then return 1 end
    if m:get_int("mw_guardian_defeated") ~= 1 then return 2 end
    if m:get_int("mw_chapter_finished") ~= 1 then return 3 end
    return 4
end
local function title(p)
    local n = phase(p)
    if n == 1 then return "CHAPTER 1  |  CRYSTALS: " .. p:get_meta():get_int("mw_crystals") .. "/5" end
    if n == 2 then return "CHAPTER 2  |  DEFEAT THE CRYSTAL GUARDIAN" end
    if n == 3 then return "CHAPTER 3  |  CRAFT AND PLACE THE CRYSTAL LANTERN" end
    return "MURDIWORLD  |  THE CRYSTAL QUEST IS COMPLETE!"
end
local function refresh(p)
    if not p or not p:is_player() then return end
    local name = p:get_player_name()
    if not hud[name] then
        hud[name] = p:hud_add({
            hud_elem_type = "text",
            position = {x = 0.02, y = 0.18},
            offset = {x = 0, y = 0},
            text = title(p),
            alignment = {x = 1, y = 0},
            number = 0xfce6a1,
            scale = {x = 100, y = 20}
        })
    else
        p:hud_change(hud[name], "text", title(p))
    end
end
local function show(p)
    local n = phase(p)
    local headline, desc
    if n == 1 then
        headline = "1 / 3    CRYSTAL HUNT"
        desc = "Mine five glowing Azure Crystal ores underground. The beacon is your first reward."
    elseif n == 2 then
        headline = "2 / 3    THE GUARDIAN"
        desc = "The Crystal Guardian has awakened. Prepare a sword and summon it in a safe arena."
    elseif n == 3 then
        headline = "3 / 3    YOUR VICTORY"
        desc = "Use the Guardian Heart to craft a Crystal Lantern. Place it to finish the adventure."
    else
        headline = "YOUR LEGEND HAS BEGUN!"
        desc = "You have completed all three chapters. Build, explore and invite a friend."
    end
    local parts = {
        "formspec_version[4]",
        "size[11,7]",
        "bgcolor[#101b31;true]",
        "label[0.5,0.5;MURDIWORLD / CRYSTAL GUARDIAN]",
        "label[0.5,1.3;" .. core.formspec_escape(headline) .. "]",
        "textarea[0.55,2;10,1.8;story;;" .. core.formspec_escape(desc) .. "]",
        "label[0.5,4.0;Progress and rewards are saved for every player.]",
        "button_exit[7.8,5.9;2.6,0.8;close;PLAY]"
    }
    if n == 2 then
        parts[#parts+1] = "button[0.6,4.9;5.8,0.8;summon;SUMMON CRYSTAL GUARDIAN]"
    end
    core.show_formspec(p:get_player_name(), "mw_adventure:quest", table.concat(parts))
end

core.register_craftitem("mw_adventure:guardian_heart", {
    description = "Guardian Heart (earned in the MURDIWORLD adventure)",
    inventory_image = "mw_shard.png",
    stack_max = 1
})
core.register_node("mw_adventure:crystal_lantern", {
    description = "Crystal Victory Lantern",
    drawtype = "glasslike",
    tiles = {"mw_beacon.png"},
    paramtype = "light",
    light_source = 14,
    sunlight_propagates = true,
    groups = {cracky=2, pickaxey=2, building_block=1},
    _mcl_hardness = 2,
    _mcl_blast_resistance = 3
})
core.register_craft({
    type = "shapeless",
    output = "mw_adventure:crystal_lantern",
    recipe = {"mw_adventure:guardian_heart", "mw_core:shard"}
})

core.register_entity("mw_adventure:crystal_guardian", {
    initial_properties = {
        physical = true,
        collide_with_objects = true,
        collisionbox = {-0.63, -0.8, -0.63, 0.63, 1.15, 0.63},
        visual = "cube",
        visual_size = {x=1.4, y=1.9},
        textures = {
            "mw_beacon.png", "mw_beacon.png", "mw_crystal_ore.png",
            "mw_crystal_ore.png", "mw_beacon.png", "mw_beacon.png"
        },
        hp_max = 14,
        static_save = false
    },
    health = 14,
    owner = "",
    age = 0,
    strike_timer = 0,
    on_activate = function(self, staticdata)
        self.owner = staticdata or ""
        self.health = 14
        self.strike_timer = 0
        self.age = 0
    end,
    on_step = function(self, dt)
        self.age = self.age + dt
        self.strike_timer = self.strike_timer + dt
        local p = core.get_player_by_name(self.owner)
        if not p then
            self.object:remove()
            active[self.owner] = nil
            return
        end
        if self.age > 600 then
            message(p, "The Guardian vanished. Type /mwquest to try again.")
            self.object:remove()
            active[self.owner] = nil
            return
        end
        local here = self.object:get_pos()
        local target = p:get_pos()
        if not here or not target then return end
        local dist = vector.distance(here, target)
        if dist > 60 then return end
        local velocity = self.object:get_velocity() or {x=0,y=0,z=0}
        if dist > 2 and dist < 30 then
            local dir = vector.direction(here, target)
            self.object:set_velocity({x=dir.x*2.7, y=velocity.y, z=dir.z*2.7})
            self.object:set_yaw(math.atan2(dir.z, dir.x)-math.pi/2)
        else
            self.object:set_velocity({x=0,y=velocity.y,z=0})
        end
        if dist <= 2.5 and self.strike_timer >= 2.4 then
            self.strike_timer = 0
            if p:get_hp() > 0 then p:set_hp(math.max(0, p:get_hp()-2)) end
            message(p, "Crystal Guardian attacks! Take cover!")
        end
    end,
    on_punch = function(self, hitter)
        if not hitter or not hitter:is_player() or hitter:get_player_name() ~= self.owner then return end
        self.health = self.health - 1
        if self.health > 0 then
            if self.health % 4 == 0 then
                message(hitter, "Guardian health: " .. self.health .. "/14")
            end
            return
        end
        local m = hitter:get_meta()
        if m:get_int("mw_guardian_defeated") ~= 1 then
            m:set_int("mw_guardian_defeated", 1)
            hitter:get_inventory():add_item("main", "mw_adventure:guardian_heart")
            message(hitter, "VICTORY! You defeated the Crystal Guardian. Guardian Heart awarded!")
            message(hitter, "Craft a Crystal Lantern from Guardian Heart + Azure Shard.")
        end
        refresh(hitter)
        active[self.owner] = nil
        self.object:remove()
    end
})

local function summon(p)
    if phase(p) ~= 2 then
        message(p, "Complete the crystal hunt before summoning the Guardian.")
        return
    end
    local name = p:get_player_name()
    if active[name] and active[name]:get_pos() then
        message(p, "The Crystal Guardian is already nearby.")
        return
    end
    local pos = p:get_pos()
    local target = {x=pos.x+4, y=pos.y+1, z=pos.z+4}
    local obj = core.add_entity(target, "mw_adventure:crystal_guardian", name)
    if not obj then
        message(p, "Guardian could not appear here. Try an open, flat area.")
        return
    end
    active[name] = obj
    message(p, "The CRYSTAL GUARDIAN has appeared! Defeat it to earn the Guardian Heart.")
end

core.register_on_player_receive_fields(function(p, formname, fields)
    if formname ~= "mw_adventure:quest" then return false end
    if fields.summon then summon(p) end
    return true
end)
core.register_on_placenode(function(_, node, placer)
    if node.name ~= "mw_adventure:crystal_lantern" or not placer or not placer:is_player() then return end
    local m = placer:get_meta()
    if m:get_int("mw_guardian_defeated") ~= 1 or m:get_int("mw_chapter_finished") == 1 then return end
    m:set_int("mw_chapter_finished", 1)
    message(placer, "ADVENTURE COMPLETE! Your crystal lantern shines. The world is yours to explore.")
    refresh(placer)
end)
core.register_on_dignode(function(_, oldnode, digger)
    if oldnode.name == "mw_core:crystal_ore" and digger and digger:is_player() then
        core.after(0, function()
            if digger and digger:is_player() then refresh(digger) end
        end)
    end
end)
core.register_on_joinplayer(function(p)
    local name = p:get_player_name()
    hud[name] = nil
    refresh(p)
    core.after(4, function()
        local live = core.get_player_by_name(name)
        if live then
            message(live, "New Crystal Guardian adventure! Type /mwquest to see your three chapters.")
        end
    end)
end)
core.register_on_leaveplayer(function(p)
    local name = p:get_player_name()
    hud[name] = nil
    if active[name] and active[name]:get_pos() then active[name]:remove() end
    active[name] = nil
end)
core.register_chatcommand("mwquest", {
    description = "Open the new Crystal Guardian three-chapter adventure",
    func = function(name)
        local p = core.get_player_by_name(name)
        if not p then return false, "Player is not online." end
        show(p)
        return true, "Adventure opened"
    end
})
core.log("action", "[mw_adventure] MURDIWORLD 0.2 Crystal Guardian quest enabled")

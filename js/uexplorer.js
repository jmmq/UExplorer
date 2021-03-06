function startUniverse() {
    var radius=24;
    var particle_types=[];
    
    particle_types.push(new particleType('rgb(255,160,160)',radius,new interactionValue(0,1)));
    particle_types.push(new particleType('rgb(160,255,160)',radius,new interactionValue(0,-1)));
    particle_types.push(new particleType('rgb(160,160,255)',radius,new interactionValue(1,0)));
    particle_types.push(new particleType('rgb(255,192,128)',radius,new interactionValue(-1,0)));
    particle_types.push(new particleType('rgb(255,128,192)',radius,new interactionValue(-1,1)));
    particle_types.push(new particleType('rgb(192,255,128)',radius,new interactionValue(1,-1)));
    particle_types.push(new particleType('rgb(192,128,255)',radius,new interactionValue(1,1)));
    particle_types.push(new particleType('rgb(192,255,128)',radius,new interactionValue(-1,-1)));

    universe=new universe(256+128,256,particle_types,32,2,false,64);
    universe.initialize();
}

function exist_particle(value,number_of_particle_types){
    if(value>=0&&value<number_of_particle_types){
        return true;
    }
    return false;
}

function fill_space_randomly(space,particle_types,inverseProbability){
    for(var column=0;column<space.length;column++){
        for(var row=0;row<space[0].length;row++){
            var value=Math.floor(Math.random() *particle_types.length*inverseProbability);   // returns a number between 0 and 9 
            if(exist_particle(value,particle_types.length)){
                space[column][row]=new cell(new field(new interactionValue(0,0)),new particle(particle_types[value]));
            }
            else{
                space[column][row]=new cell(new field(new interactionValue(0,0)),null);
            }
        }
    }
}

function universe(spaceWidth,spaceHeight,particle_types,iteration_time,cell_size,shake,invProbability){
    this.shake=shake;
    this.cell_size=cell_size;
    this.iteration=0;
    this.iteration_time=iteration_time;
    //console.log("creating universe");
    this.space=new Array(spaceWidth);
    for (var i = 0; i < this.space.length; i++) {
        this.space[i] = new Array(spaceHeight);
    }
    this.particle_types=particle_types;
    fill_space_randomly(this.space,this.particle_types,invProbability);
    this.canvas=document.createElement("canvas");
    this.iterate=function(){
        iteration(this.universe);
    }
    this.initialize=function(){
        //console.log("initializing");
        this.ctx=this.canvas.getContext("2d");
        this.canvas.width = spaceWidth*this.cell_size;
        this.canvas.height = spaceHeight*this.cell_size;
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(this.iterate , this.iteration_time);
    }
}

function modularize(value,change,low,high){
    var result=value+change;
    if(result<low){
        do{
            result+=high-low;
        }while(result<low)
    }else if(result>=high){
        do{
            result-=high-low;
        }while(result>=high)
    }
    return result;
}

function move_x(space,before,change){
    return modularize(before,change,0,get_space_width(space));
}

function move_y(space,before,change){
    return modularize(before,change,0,get_space_height(space));
}

function get_space_width(space){
    return space.length;
}

function get_space_height(space){
    return space[0].length;
}

function particle_field_interaction(space,column,row,particle){
    var radius=particle.particleType.interactionRadius;
    var c=move_x(space,column,(-1)*radius);
    var counter1=0;
    var r,counter2;
    while(counter1<(radius*2+1)){
        {
            r=move_y(space,row,(-1)*radius)
            counter2=0;
            while(counter2<(radius*2+1)){
                {
                    space[c][r].field.interactionValue.interact(particle.particleType.interactionValue);
                }
                r=move_y(space,r,1);
                counter2++;
            }
        }
        c=move_x(space,c,1);
        counter1++;
    }
}

function reset_fields(space,x,y){
    for(var column=0;column<get_space_width(universe.space);column++){
        for(var row=0;row<get_space_height(universe.space);row++){ 
            space[column][row].field.interactionValue.set(x,y);
        }
    }
}
function particle_field_interaction_phase(universe){
    //console.log("Particle-Field phase");
    if(universe.shake){
        var x=((universe.iteration+2)%3)-1;
        var y=((universe.iteration+1)%3)-1;
        reset_fields(universe.space,x,y);
    }else{
        reset_fields(universe.space,0,0);
    }
    for(var column=0;column<get_space_width(universe.space);column++){
        for(var row=0;row<get_space_height(universe.space);row++){
            if(universe.space[column][row].particle!=null){
                particle_field_interaction(universe.space,column,row,universe.space[column][row].particle)
            }
        }
    }
}

function move_particle(space,particle,c,r){
    var iValue=space[c][r].field.interactionValue;
    var x=move_x(space,c,iValue.x);
    var y=move_y(space,r,iValue.y);
    var target=space[x][y];
    if(target.particle==null){
        space[c][r].particle=null;
        target.particle=particle;
    }
}

function field_particle_interaction_phase(universe){
    //console.log("Field-Particle phase");
    var selected_p;
    for(var column=0;column<universe.space.length;column++){
        for(var row=0;row<universe.space[0].length;row++){
            selected_p=universe.space[column][row].particle;
            if(selected_p!=null){
                if(selected_p.can_move){
                    move_particle(universe.space,selected_p,column,row);
                    selected_p.can_move=false;
                }
            }
        }
    }
    for(var column=0;column<universe.space.length;column++){
        for(var row=0;row<universe.space[0].length;row++){
            selected_p=universe.space[column][row].particle;
            if(selected_p!=null){
                selected_p.can_move=true;
            }
        }
    }
}

function draw_rectangle(canvas,ctx,color,xi,yi,xf,yf){
    ctx.fillStyle = color;
    ctx.fillRect(xi,yi,xf-xi,yf-yi);
}

function draw_cell(universe,column,row,color){
    draw_rectangle(
        universe.canvas,
        universe.ctx,
        color,
        column*universe.cell_size,
        row*universe.cell_size,
        column*universe.cell_size+universe.cell_size,
        row*universe.cell_size+universe.cell_size,
    );
}

function draw_empty_cell(universe,column,row){
    draw_cell(universe,column,row,'rgb(0,0,0)');
}

function draw_particle(universe,column,row,particle){
    draw_cell(universe,column,row,particle.particleType.color);
}

function update_canvas(universe){
    //console.log("updating canvas")
    var space=universe.space;
    var selected_p;
    clear_canvas(universe.canvas,universe.ctx);
    for(var c=0;c<space.length;c++){
        for(var r=0;r<space[0].length;r++){
            selected_p=space[c][r].particle;
            if(selected_p!=null){
                draw_particle(universe,c,r,selected_p);
            }
        }
    }
}

function clear_canvas(canvas,ctx){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function iteration(universe){
    //console.log("iteration ("+universe.iteration+')');
    //console.log(universe.space);
    update_canvas(universe);
    particle_field_interaction_phase(universe);
    field_particle_interaction_phase(universe);
    universe.iteration++;
}

function interactionValue(x,y){
    this.x=x;
    this.y=y;
    this.interact=function (interactionValue){
        this.x+=interactionValue.x;
        this.y+=interactionValue.y;
    }
    this.set=function (x,y){
        this.x=x;
        this.y=y;
    }
}

function field(interactionValue){
    this.interactionValue=interactionValue;
}

function particleType(color,interactionRadius,interactionValue){
    this.color=color;
    this.interactionRadius=interactionRadius;
    this.interactionValue=interactionValue;
}

function particle(particleType){
    this.particleType=particleType;
    this.can_move=true;
}

function cell(field,particle){
    this.field=field;
    this.particle=particle;
}

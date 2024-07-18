export const generateSlots=()=>{
    let start=9,end=16,lunchBreak=13
    let slots=[]
    for(let hr=start;hr<=end;hr++){
        if(hr!==lunchBreak){
    slots.push(hr)
        }
    }
    return slots
    }
    
    




// export const generateSlots=(servicePerHr:number=1)=>{
// let start=9,end=17,lunchBreak=13
// let slots=[]
// for(let hr=start;hr<=end;hr++){
//     if(hr!==lunchBreak){
// slots.push({hr,servicePerHr})
//     }
// }
// return slots
// }


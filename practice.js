// // const a = [12, 21, 3, 2, 332, 21, 3, 12];
// // const b = [];

// // function equal() {
// //   for (let i = 0; i < a.length; i++) {
// //     if (i % 2 === 0) {
// //       b.push(a[i]);
// //     }
// //   }
// //   return b;
// // }

// // const odd = equal();

// // function Sum(odd) {
// //   let maxSum = 0;
// //   let pair = [];
// //   for (let i = 0; i < odd.length; i++) {
// //     for (let j = i + 1; j < odd.length; j++) {
// //       const sum = odd[i] + odd[j];
// //       if (sum > maxSum) {
// //         maxSum = sum;
// //         pair = [odd[i], odd[j]];
// //       }
// //     }
// //   }
// //   console.log("Max sum:", maxSum);
// //   console.log("Pair with max sum:", pair);
// // }

// // Sum(odd);



// // class animal{
// //     constructor(name){
// // this.name=name
// // console.log("object is created...")
// //     }
// //     eat(){
// //         console.log("i am eating")
// //     }
// //  jump(){
// //     console.log("i am jumping")
// //  }
// // }
// // class lion extends animal{
// //     constructor(name){
// //         super(name)
// //         this.name=name
// //         console.log("object lion is created.......")
// // }
// // kills(){
// //     console.log("lion kills..")
// // }
// // eat(){
// //     super.eat()
// //     console.log("lion eats meat")
// // }
// // }

// // let a= new animal("kishore")
// // let b=new lion("bala")
// // const type = new Typed('.text', {
// //     strings: ["hi", "hellow", "ayooooo"],
// //     typeSpeed: 100,
// //     backSpeed: 100,
// //     backDelay: 1000,
// //     loop: true
// // });


// // let students=["kishore","pandu","konda","sagar","balakishiore","kondareddy"]

// // let houses=[]

// // for (const element of students) {
// //     if (element.length  < 6){
// //         houses.push("one")
// //     }
// //     else if(element.length < 8){
// //         houses.push("two")
// //     }
// //     else if(element.length < 12)
// //         houses.push("three")
// // }

// // console.log(houses)

// if(localStorage.getItem("name")){
//     a=localStorage.getItem("name")
//     document.write("welcome"+a)
// }
// else{
//     let a=prompt("enter your name")
//     localStorage.setItem("name",a)
//     document.write("welcome"+a)
// }

let people={
name:"rihana",
age:20,
grade:12,
"like birds":true
};
people["like birds"]=false;
alert(people.name);
people.isMarried=false;
delete people.grade;

alert(people["like birds"])
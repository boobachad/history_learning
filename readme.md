#history_learning

goal is simple: based upon what the user is learning(judging from the history) create a personalized roadmap which shows what the user is learning. eg user is learning something about http servers(i'm learning it) this is where the cross referecning thing comes on its better to place that entry in the express topic so its about placements

the whole proejct is based upon ambiguity the server doesnt not know what the user has learned or will learn(can add with ai) the focus is on what the user is learning what here on the roadmap accoridng to leading sites it stands

there would be 2 things 1.extension which would fetch the history entries and then sent to the server for processing 2.the server's main role: 1.would be to process the history entries 2.then cross reference with leading roadmaps liek roadmap.sh and many more 1.the cross refencing thing is easy but getting that roadmaps is a tickel.. 2.can use ai instead of nlp but still need to figure out accoridngly 3.accoridng to that try to place them on the page.

update:
thoughts: what i suppose the system should do is it has to keep figuring out what the parent of the current child(history entry) is. 
eg: if i have entry about mdn about websockets so maybe i am learning websockets(confidence low since i have only 1 entry) lets say i have some more entries so that yes the system has proof the user is learning websockets and confidence is high. lets say i have some more related entries like how does chat systems work. well now the next parent or there is a new parent now which is learning a chat system. so websockets is now a grandparent whereas any entries related to chat sytems comes now under chat system.

so the system is designed at every time press a button to figure out who the possible parent not just immediate parent if u see this becomes more like a family tree. is of the current child(history entry) 

still thoughts are unclear i'll setup a proper readme when i have everything clear

<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body>
<?PHP
//향토음식 IPC
if(isset($_REQUEST["type"]) && $_REQUEST["type"] == "1"){
	//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
	$apiKey = "발급받은인증키를삽입하세요";
	//서비스 명
	$serviceName = "nvpcFdCkry";
	//오퍼레이션 명
	$operationName = "clIpcCodeInfo";

	//XML 받을 URL 생성
	$parameter = "/".$serviceName."/".$operationName;
	$parameter .= "?apiKey=".$apiKey;

	if(isset($_REQUEST["dNo"])){
		$parameter .= "&code=";
		$parameter .= $_REQUEST["dNo"];
	}
	$nm = $_REQUEST["nm"];

	$url = "http://api.nongsaro.go.kr/service" . $parameter;

	//XML Parsing
	$xml = file_get_contents($url);
	//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
	$object = simplexml_load_string($xml);

	if(count($object->body[0]->items[0]->item) == 0){
?>
	<h3>조회한 정보가 없습니다.</h3>
<?PHP
	}else{
?>
<h4><strong> * 샘플화면은 디자인을 적용하지 않았으니, 개별 사이트의 스타일에 맞게 코딩하시기 바랍니다.</strong></h4>
<h3><strong>향토음식 IPC</strong></h3><hr>
	<table width="100%" border="1" cellSpacing="0" cellPadding="0">
		<colgroup>
			<col style="width:25%;"/>
			<col />
		</colgroup>
		<tr>
			<th>IPC</th>
			<th><?=$nm?></th>
		</tr>
<?PHP
		foreach($object->body[0]->items[0]->item as $item){
			//코드명
			$codeNm = $item->codeNm;
			//코드설명
			$codeDc = $item->codeDc;
?>
		<tr>
   			<td>
<?PHP
			if(strlen($codeNm)==1){echo "섹션<br />(Section)";}
   			else if(strlen($codeNm)==3){echo "클래스<br />(Class)";}
   			else if(strlen($codeNm)==4){echo "서브클래스<br />(SubClass)";}
?>
   			</td>
   			<td><?=$codeNm?><?=$codeDc?></td>
		</tr>
<?PHP
		}
?>
	</table>
<?PHP
	}
}
?>

<?PHP
//고문헌
if(isset($_REQUEST["type"]) && $_REQUEST["type"] == "2"){
	//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
	$apiKey = "발급받은인증키를삽입하세요";
	//서비스 명
	$serviceName = "nvpcFdCkry";
	//오퍼레이션 명
	$operationName = "oldLtrtreInfo";

	//XML 받을 URL 생성
	$parameter = "/".$serviceName."/".$operationName;
	$parameter .= "?apiKey=".$apiKey;

	if(isset($_REQUEST["dNo"])){
		$parameter .= "&code=";
		$parameter .= $_REQUEST["dNo"];
	}

	$url = "http://api.nongsaro.go.kr/service" . $parameter;

	//XML Parsing
	$xml = file_get_contents($url);
	$object = simplexml_load_string($xml);

	if(count($object->body[0]->item[0]) == 0){
?>
	<h3>조회한 정보가 없습니다.</h3>
<?PHP
	}else{
?>
<h4><strong> * 샘플화면은 디자인을 적용하지 않았으니, 개별 사이트의 스타일에 맞게 코딩하시기 바랍니다.</strong></h4>
<h3><strong>고문헌</strong></h3><hr>
	<table width="100%" border="1" cellSpacing="0" cellPadding="0">
		<colgroup>
			<col style="width:20%;"/>
			<col />
		</colgroup>
<?PHP

			//고문헌 명
			$oldLtrtreNm = $object->body[0]->item[0]->oldLtrtreNm;
			//발행연도
			$pblctDe = $object->body[0]->item[0]->pblctDe;
			//전체페이지수
			$pgeCo = $object->body[0]->item[0]->pgeCo;
			//저자명
			$authr = $object->body[0]->item[0]->authr;
			//출판사
			$plscmpnNm = $object->body[0]->item[0]->plscmpnNm;
			//원본소장기관
			$originInsttNm = $object->body[0]->item[0]->originInsttNm;
			//주요내용
			$sumryCn = $object->body[0]->item[0]->sumryCn;
?>
		<tr>
   			<td>고문헌 명</td>
   			<td><?=$oldLtrtreNm?></td>
   		</tr>
   		<tr>
   			<td>발행연도</td>
   			<td><?=$pblctDe?></td>
   		</tr>
   		<tr>
   			<td>전체페이지수</td>
   			<td><?=$pgeCo?></td>
   		</tr>
   		<tr>
   			<td>저자명</td>
   			<td><?=$authr?></td>
   		</tr>
   		<tr>
   			<td>출판사</td>
   			<td><?=$plscmpnNm?></td>
   		</tr>
   		<tr>
   			<td>원본소장기관</td>
   			<td><?=$originInsttNm?></td>
   		</tr>
   		<tr>
   			<td>주요내용</td>
   			<td><?=$sumryCn?></td>
   		</tr>
	</table>
<?PHP
	}
}
?>
</body>
</html>